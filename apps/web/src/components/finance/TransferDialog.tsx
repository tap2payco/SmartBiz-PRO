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
import { Loader2, ArrowRight } from 'lucide-react'

const transferSchema = z.object({
    fromAccountId: z.string().uuid('Select a source account'),
    toAccountId: z.string().uuid('Select a target account'),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    description: z.string().optional()
})

type TransferFormData = z.infer<typeof transferSchema>

interface Account {
    id: string
    name: string
    currentBalance: string
    currency: string
}

interface TransferDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    accounts: Account[]
    onSuccess: () => void
}

export function TransferDialog({ open, onOpenChange, accounts, onSuccess }: TransferDialogProps) {
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0]
        }
    })

    const fromAccountId = watch('fromAccountId')
    const toAccountId = watch('toAccountId')

    const selectedSourceAccount = accounts.find(a => a.id === fromAccountId)

    const onSubmit = async (data: TransferFormData) => {
        if (data.fromAccountId === data.toAccountId) {
            alert('Cannot transfer to the same account')
            return
        }

        if (selectedSourceAccount && data.amount > parseFloat(selectedSourceAccount.currentBalance)) {
            alert('Insufficient funds in source account')
            return
        }

        setLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/transfer`, {
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
                alert(error.error || 'Failed to process transfer')
            }
        } catch (error) {
            console.error('Failed to transfer:', error)
            alert('Failed to process transfer')
        } finally {
            setLoading(false)
        }
    }

    // Filter target accounts to exclude source
    const targetAccounts = accounts.filter(a => a.id !== fromAccountId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer Money</DialogTitle>
                    <DialogDescription>Move funds between accounts</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Select onValueChange={(value) => setValue('fromAccountId', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <ArrowRight className="text-muted-foreground mt-6" />
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Select onValueChange={(value) => setValue('toAccountId', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Target" />
                                </SelectTrigger>
                                <SelectContent>
                                    {targetAccounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {errors.fromAccountId && <p className="text-xs text-red-500">{errors.fromAccountId.message}</p>}
                    {errors.toAccountId && <p className="text-xs text-red-500">{errors.toAccountId.message}</p>}

                    {selectedSourceAccount && (
                        <div className="text-sm text-muted-foreground text-center bg-muted/50 p-2 rounded">
                            Available Balance: {parseFloat(selectedSourceAccount.currentBalance).toLocaleString()} {selectedSourceAccount.currency}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
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

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea {...register('description')} placeholder="Reason for transfer..." rows={2} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transfer Funds'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
