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

const expenseSchema = z.object({
    categoryId: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().positive('Amount must be positive'),
    expenseDate: z.string().min(1, 'Date is required'),
    reference: z.string().optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().optional()
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseCategory {
    id: string
    name: string
    type: string
}

interface AddExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddExpenseDialog({ open, onOpenChange, onSuccess }: AddExpenseDialogProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const { getToken } = useAuth()

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            expenseDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'CASH'
        }
    })

    useEffect(() => {
        if (open) {
            fetchCategories()
        }
    }, [open])

    const fetchCategories = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        }
    }

    const onSubmit = async (data: ExpenseFormData) => {
        setLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                reset()
                onOpenChange(false)
                onSuccess()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to add expense')
            }
        } catch (error) {
            console.error('Failed to add expense:', error)
            alert('Failed to add expense')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input {...register('description')} placeholder="Office supplies, Utilities, etc." />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount (TZS) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('amount', { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                            {errors.amount && (
                                <p className="text-sm text-red-500">{errors.amount.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Date *</Label>
                            <Input type="date" {...register('expenseDate')} />
                            {errors.expenseDate && (
                                <p className="text-sm text-red-500">{errors.expenseDate.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select onValueChange={(value) => setValue('categoryId', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select
                                defaultValue="CASH"
                                onValueChange={(value) => setValue('paymentMethod', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reference (Receipt #, Invoice #)</Label>
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
                            {loading ? 'Adding...' : 'Add Expense'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
