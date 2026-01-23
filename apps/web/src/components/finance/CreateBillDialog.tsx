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
import { useAuth } from '@/contexts/AuthContext'
import { SupplierSelect } from '@/components/purchases/SupplierSelect'

const billSchema = z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: z.string().optional(),
    subtotal: z.number().positive('Subtotal must be positive'),
    taxTotal: z.number().min(0).default(0),
    totalAmount: z.number().positive('Total must be positive'),
})

type BillFormData = z.infer<typeof billSchema>

interface CreateBillDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    purchaseOrderId?: string
}

export function CreateBillDialog({ open, onOpenChange, onSuccess, purchaseOrderId }: CreateBillDialogProps) {
    const [loading, setLoading] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
    const { getToken } = useAuth()

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BillFormData>({
        resolver: zodResolver(billSchema),
        defaultValues: {
            taxTotal: 0,
            invoiceDate: new Date().toISOString().split('T')[0]
        }
    })

    const subtotal = watch('subtotal') || 0
    const taxTotal = watch('taxTotal') || 0

    useEffect(() => {
        setValue('totalAmount', subtotal + taxTotal)
    }, [subtotal, taxTotal, setValue])

    const onSubmit = async (data: BillFormData) => {
        setLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/bills`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    purchaseOrderId: purchaseOrderId || undefined
                })
            })

            if (res.ok) {
                reset()
                setSelectedSupplier(null)
                onOpenChange(false)
                onSuccess()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to create bill')
            }
        } catch (error) {
            console.error('Failed to create bill:', error)
            alert('Failed to create bill')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Supplier Bill</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Supplier *</Label>
                        <SupplierSelect
                            value={selectedSupplier?.id}
                            onSelect={(supplier) => {
                                setSelectedSupplier(supplier)
                                setValue('supplierId', supplier.id)
                            }}
                        />
                        {errors.supplierId && (
                            <p className="text-sm text-red-500">{errors.supplierId.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Invoice Number *</Label>
                            <Input {...register('invoiceNumber')} placeholder="INV-001" />
                            {errors.invoiceNumber && (
                                <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Invoice Date *</Label>
                            <Input type="date" {...register('invoiceDate')} />
                            {errors.invoiceDate && (
                                <p className="text-sm text-red-500">{errors.invoiceDate.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" {...register('dueDate')} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Subtotal (TZS) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('subtotal', { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                            {errors.subtotal && (
                                <p className="text-sm text-red-500">{errors.subtotal.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Tax (TZS)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('taxTotal', { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Total (TZS)</Label>
                            <Input
                                type="number"
                                value={subtotal + taxTotal}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Bill'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
