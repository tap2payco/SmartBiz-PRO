'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Loader2 } from 'lucide-react'

const adjustSchema = z.object({
    type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    description: z.string().optional()
})

type AdjustFormData = z.infer<typeof adjustSchema>

interface Account {
    id: string
    name: string
    currentBalance: string
    currency: string
}

interface AdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account: Account
    onSuccess: () => void
}

export function AdjustmentDialog({ open, onOpenChange, account, onSuccess }: AdjustmentDialogProps) {
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AdjustFormData>({
        resolver: zodResolver(adjustSchema),
        defaultValues: {
            type: 'DEPOSIT',
            date: new Date().toISOString().split('T')[0]
        }
    })

    const type = watch('type')

    const onSubmit = async (data: AdjustFormData) => {
        if (data.type === 'WITHDRAWAL' && data.amount > parseFloat(account.currentBalance)) {
            alert('Insufficient funds for withdrawal')
            return
        }

        setLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/adjust`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accountId: account.id,
                    ...data
                })
            })

            if (res.ok) {
                reset()
                onOpenChange(false)
                onSuccess()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to process adjustment')
            }
        } catch (error) {
            console.error('Failed to adjust:', error)
            alert('Failed to process adjustment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manual Balance Adjustment</DialogTitle>
                    <DialogDescription>
                        Manually record a deposit or withdrawal for {account.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            defaultValue="DEPOSIT"
                            onValueChange={(value) => setValue('type', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DEPOSIT">Deposit (Increase Balance)</SelectItem>
                                <SelectItem value="WITHDRAWAL">Withdrawal (Decrease Balance)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount ({account.currency})</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register('amount', { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" {...register('date')} />
                            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                        </div>
                    </div>

                    {type === 'WITHDRAWAL' && (
                        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                            Max Withdrawal: {parseFloat(account.currentBalance).toLocaleString()} {account.currency}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea {...register('description')} placeholder="Reason for adjustment..." rows={2} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Adjustment'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
