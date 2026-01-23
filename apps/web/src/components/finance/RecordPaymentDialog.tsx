'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'

const paymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY', 'OTHER']),
    paymentDate: z.string().min(1, 'Payment date is required'),
    reference: z.string().optional(),
    accountId: z.string().optional(), // Optional, but recommended for better tracking
    notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface Bill {
    id: string
    invoiceNumber: string
    totalAmount: string
    paidAmount: string
    supplier: {
        id: string
        name: string
    }
}

interface RecordPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bill: Bill
    onSuccess: () => void
}

export function RecordPaymentDialog({ open, onOpenChange, bill, onSuccess }: RecordPaymentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])

    const { getToken } = useAuth()
    const outstanding = parseFloat(bill.totalAmount) - parseFloat(bill.paidAmount)

    const fetchAccounts = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error)
        }
    }

    // Trigger fetch when dialog opens
    useEffect(() => {
        if (open) fetchAccounts()
    }, [open])

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: outstanding,
            paymentMethod: 'CASH',
            paymentDate: new Date().toISOString().split('T')[0]
        }
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const onSubmit = async (data: PaymentFormData) => {
        setLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/bills/${bill.id}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    supplierInvoiceId: bill.id,
                    supplierId: bill.supplier.id
                })
            })

            if (res.ok) {
                reset()
                onOpenChange(false)
                onSuccess()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to record payment')
            }
        } catch (error) {
            console.error('Failed to record payment:', error)
            alert('Failed to record payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-lg mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Invoice:</span>
                        <span className="font-medium">{bill.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="font-medium">{bill.supplier.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(bill.totalAmount))}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Already Paid:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(bill.paidAmount))}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground font-medium">Outstanding:</span>
                        <span className="font-bold text-red-600">{formatCurrency(outstanding)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Pay From (Source Account)</Label>
                        <Select
                            onValueChange={(value) => setValue('accountId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select account (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency} {parseFloat(acc.currentBalance).toLocaleString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Select where the money is coming from to track liquidity.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Amount (TZS) *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            max={outstanding}
                            {...register('amount', { valueAsNumber: true })}
                        />
                        {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Payment Method *</Label>
                            <Select
                                defaultValue="CASH"
                                onValueChange={(value) => setValue('paymentMethod', value as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Date *</Label>
                            <Input type="date" {...register('paymentDate')} />
                            {errors.paymentDate && (
                                <p className="text-sm text-red-500">{errors.paymentDate.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reference (Cheque #, Transaction ID, etc.)</Label>
                        <Input {...register('reference')} placeholder="Optional reference" />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea {...register('notes')} placeholder="Optional notes" rows={2} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Payment'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
