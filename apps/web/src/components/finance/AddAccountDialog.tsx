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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

const accountSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['CASH', 'BANK', 'MOBILE_MONEY']),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    currency: z.string().min(1),
    initialBalance: z.coerce.number().min(0, 'Balance cannot be negative')
})

type AccountFormData = z.infer<typeof accountSchema>

interface AddAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            type: 'CASH',
            currency: 'TZS',
            initialBalance: 0
        }
    })

    const accountType = watch('type')

    const onSubmit = async (data: AccountFormData) => {
        setLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
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
                alert(error.error || 'Failed to create account')
            }
        } catch (error) {
            console.error('Failed to create account:', error)
            alert('Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Account</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Account Name *</Label>
                        <Input {...register('name')} placeholder="e.g. Main Cash Drawer, CRDB" />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Account Type *</Label>
                        <Select
                            defaultValue="CASH"
                            onValueChange={(value) => setValue('type', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK">Bank Account</SelectItem>
                                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {accountType !== 'CASH' && (
                        <>
                            <div className="space-y-2">
                                <Label>Bank/Provider Name</Label>
                                <Input {...register('bankName')} placeholder={accountType === 'BANK' ? "e.g. CRDB, NMB" : "e.g. M-Pesa, Airtel Money"} />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Number</Label>
                                <Input {...register('accountNumber')} placeholder="Account / Phone Number" />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Input {...register('currency')} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Opening Balance</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register('initialBalance', { valueAsNumber: true })}
                            />
                            {errors.initialBalance && (
                                <p className="text-sm text-red-500">{errors.initialBalance.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
