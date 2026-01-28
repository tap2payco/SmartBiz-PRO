import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    supplierInvoices,
    purchasePayments,
    purchaseOrders,
    stakeholders,
    bankAccounts,
    bankTransactions
} from '@smartbiz/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

const app = new Hono<{ Variables: Variables }>();

// Validation schemas
const createBillSchema = z.object({
    supplierId: z.string().uuid(),
    purchaseOrderId: z.string().uuid().optional(),
    grnId: z.string().uuid().optional(),
    invoiceNumber: z.string().min(1),
    invoiceDate: z.string(),
    dueDate: z.string().optional(),
    subtotal: z.number().positive(),
    taxTotal: z.number().min(0).default(0),
    totalAmount: z.number().positive()
});

const createPaymentSchema = z.object({
    supplierInvoiceId: z.string().uuid(),
    supplierId: z.string().uuid(),
    amount: z.number().positive(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY', 'OTHER']),
    paymentDate: z.string(),
    reference: z.string().optional(),
    accountId: z.string().uuid().optional(),
    notes: z.string().optional()
});

// GET /finance/bills - List all bills
app.get('/bills', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const bills = await db.query.supplierInvoices.findMany({
            where: eq(supplierInvoices.organizationId, profile.organizationId),
            with: {
                supplier: true,
                purchaseOrder: true,
                payments: true
            },
            orderBy: [desc(supplierInvoices.createdAt)]
        });

        return c.json(bills);
    } catch (error) {
        console.error('List Bills Error:', error);
        return c.json({ error: 'Failed to fetch bills' }, 500);
    }
});

// GET /finance/bills/:id - Get single bill
app.get('/bills/:id', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const bill = await db.query.supplierInvoices.findFirst({
            where: and(
                eq(supplierInvoices.id, id),
                eq(supplierInvoices.organizationId, profile.organizationId)
            ),
            with: {
                supplier: true,
                purchaseOrder: {
                    with: {
                        lines: {
                            with: { item: true }
                        }
                    }
                },
                grn: true,
                payments: true
            }
        });

        if (!bill) return c.json({ error: 'Bill not found' }, 404);

        return c.json(bill);
    } catch (error) {
        console.error('Fetch Bill Error:', error);
        return c.json({ error: 'Failed to fetch bill' }, 500);
    }
});

// POST /finance/bills - Create a new bill
app.post('/bills', zValidator('json', createBillSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        const [newBill] = await db.insert(supplierInvoices).values({
            organizationId: profile.organizationId,
            supplierId: data.supplierId,
            purchaseOrderId: data.purchaseOrderId || null,
            grnId: data.grnId || null,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate || null,
            status: 'PENDING',
            subtotal: data.subtotal.toString(),
            taxTotal: data.taxTotal.toString(),
            totalAmount: data.totalAmount.toString(),
            paidAmount: '0'
        }).returning();

        return c.json(newBill, 201);
    } catch (error) {
        console.error('Create Bill Error:', error);
        return c.json({ error: 'Failed to create bill' }, 500);
    }
});

// POST /finance/bills/:id/payments - Record a payment against a bill
app.post('/bills/:id/payments', zValidator('json', createPaymentSchema), async (c) => {
    const profile = c.get('profile');
    const billId = c.req.param('id');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        const result = await db.transaction(async (tx: any) => {
            // Get the bill
            const bill = await tx.query.supplierInvoices.findFirst({
                where: and(
                    eq(supplierInvoices.id, billId),
                    eq(supplierInvoices.organizationId, profile.organizationId)
                )
            });

            if (!bill) throw new Error('Bill not found');

            // Create the payment
            const [payment] = await tx.insert(purchasePayments).values({
                organizationId: profile.organizationId,
                supplierInvoiceId: billId,
                supplierId: data.supplierId,
                amount: data.amount.toString(),
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate,
                reference: data.reference || null,
                notes: data.notes || null,
                createdBy: profile.id
            }).returning();

            // Linked Bank Transaction (if accountId provided)
            if (data.accountId) {
                // 1. Get Account to check/update
                const [account] = await tx
                    .select()
                    .from(bankAccounts)
                    .where(and(eq(bankAccounts.id, data.accountId), eq(bankAccounts.organizationId, profile.organizationId!)));

                if (!account) throw new Error('Selected bank account not found');

                // Allow overdraft? For now, let's enforce positive balance logic if needed, but standard accounting usually allows negative.
                // However, preventing accidental negative cash is good. 
                // Let's NOT throw error for insufficient funds here to allow flexibility, 
                // or maybe we should? Let's check balance but proceed (warn?). 
                // Actually, let's block if it's CASH type and insufficient?
                // For simplicity in this iteration, we allow it but log it/users handle it.

                // 2. Create Bank Transaction (Withdrawal)
                await tx.insert(bankTransactions).values({
                    organizationId: profile.organizationId!,
                    accountId: data.accountId,
                    type: 'WITHDRAWAL',
                    amount: data.amount.toString(),
                    transactionDate: data.paymentDate, // Use payment date
                    description: `Payment for Bill #${bill.invoiceNumber}`,
                    referenceType: 'PURCHASE', // Using PURCHASE for payments against bills
                    referenceId: payment.id,
                    createdBy: profile.id
                });

                // 3. Update Account Balance
                await tx
                    .update(bankAccounts)
                    .set({
                        currentBalance: sql`${bankAccounts.currentBalance} - ${data.amount}`,
                        updatedAt: new Date()
                    })
                    .where(eq(bankAccounts.id, data.accountId));
            }

            // Update bill paid amount
            const currentPaid = parseFloat(bill.paidAmount || '0');
            const newPaidAmount = currentPaid + data.amount;
            const totalAmount = parseFloat(bill.totalAmount);

            let newStatus = 'PARTIAL_PAID';
            if (newPaidAmount >= totalAmount) {
                newStatus = 'PAID';
            }

            await tx.update(supplierInvoices)
                .set({
                    paidAmount: newPaidAmount.toString(),
                    status: newStatus,
                    updatedAt: new Date()
                })
                .where(eq(supplierInvoices.id, billId));

            return payment;
        });

        return c.json(result, 201);
    } catch (error: any) {
        console.error('Create Payment Error:', error);
        return c.json({ error: error.message || 'Failed to record payment' }, 500);
    }
});

// GET /finance/payments - List all payments
app.get('/payments', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const payments = await db.query.purchasePayments.findMany({
            where: eq(purchasePayments.organizationId, profile.organizationId),
            with: {
                supplierInvoice: true,
                supplier: true
            },
            orderBy: [desc(purchasePayments.createdAt)]
        });

        return c.json(payments);
    } catch (error) {
        console.error('List Payments Error:', error);
        return c.json({ error: 'Failed to fetch payments' }, 500);
    }
});

export default app;
