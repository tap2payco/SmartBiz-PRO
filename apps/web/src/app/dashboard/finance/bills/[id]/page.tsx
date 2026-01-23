'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, DollarSign, FileText, Calendar, Building2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { RecordPaymentDialog } from '@/components/finance/RecordPaymentDialog'

interface Payment {
    id: string
    amount: string
    paymentMethod: string
    paymentDate: string
    reference: string | null
    notes: string | null
    createdAt: string
}

interface Bill {
    id: string
    invoiceNumber: string
    invoiceDate: string
    dueDate: string | null
    status: string
    subtotal: string
    taxTotal: string
    totalAmount: string
    paidAmount: string
    supplier: {
        id: string
        name: string
        email: string | null
        phone: string | null
    }
    purchaseOrder?: {
        id: string
        orderNumber: string
        lines: Array<{
            quantity: number
            unitCost: string
            totalCost: string
            item: {
                name: string
                sku: string
            }
        }>
    }
    payments: Payment[]
}

export default function BillDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [bill, setBill] = useState<Bill | null>(null)
    const [loading, setLoading] = useState(true)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const { getToken } = useAuth()

    const fetchBill = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/bills/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setBill(data)
            }
        } catch (error) {
            console.error('Failed to fetch bill:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBill()
    }, [params.id])

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0
        }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'PAID': 'bg-green-500',
            'PARTIAL_PAID': 'bg-blue-500',
            'PENDING': 'bg-yellow-500',
            'OVERDUE': 'bg-red-500',
            'DRAFT': 'bg-gray-500'
        }
        return <Badge className={styles[status] || 'bg-gray-500'}>{status.replace('_', ' ')}</Badge>
    }

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            'CASH': 'Cash',
            'BANK_TRANSFER': 'Bank Transfer',
            'CHEQUE': 'Cheque',
            'MOBILE_MONEY': 'Mobile Money',
            'OTHER': 'Other'
        }
        return labels[method] || method
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading bill details...</div>
            </div>
        )
    }

    if (!bill) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Bill not found</div>
            </div>
        )
    }

    const outstanding = parseFloat(bill.totalAmount) - parseFloat(bill.paidAmount)

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{bill.invoiceNumber}</h1>
                            {getStatusBadge(bill.status)}
                        </div>
                        <p className="text-muted-foreground">Supplier Bill</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {bill.status !== 'PAID' && (
                        <Button onClick={() => setPaymentDialogOpen(true)}>
                            <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Supplier Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" /> Supplier Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Supplier Name</p>
                                    <p className="font-medium">{bill.supplier.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{bill.supplier.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{bill.supplier.phone || '-'}</p>
                                </div>
                                {bill.purchaseOrder && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Purchase Order</p>
                                        <p className="font-medium">{bill.purchaseOrder.orderNumber}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* PO Line Items (if linked) */}
                    {bill.purchaseOrder?.lines && bill.purchaseOrder.lines.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Line Items</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Unit Cost</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bill.purchaseOrder.lines.map((line, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{line.item.name}</TableCell>
                                                <TableCell>{line.item.sku}</TableCell>
                                                <TableCell className="text-right">{line.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(line.unitCost)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(line.totalCost)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {bill.payments.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">
                                    No payments recorded yet
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bill.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                                                <TableCell>{payment.reference || '-'}</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bill Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Invoice Date</p>
                                    <p className="font-medium">{new Date(bill.invoiceDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {bill.dueDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Due Date</p>
                                        <p className="font-medium">{new Date(bill.dueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(bill.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(bill.taxTotal)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>{formatCurrency(bill.totalAmount)}</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-green-600">
                                    <span>Paid</span>
                                    <span>{formatCurrency(bill.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Outstanding</span>
                                    <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                                        {formatCurrency(outstanding)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Dialog */}
            <RecordPaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                bill={bill}
                onSuccess={fetchBill}
            />
        </div>
    )
}
