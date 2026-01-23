'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowRightLeft } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'
import { queueOperation } from '@/lib/db/ops'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

const stockAdjustmentSchema = z.object({
    type: z.enum(['GRN', 'ADJUSTMENT', 'DAMAGE', 'THEFT', 'RETURN']),
    quantity: z.number().int().refine(val => val !== 0, "Quantity cannot be zero"),
    notes: z.string().optional()
})

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>

interface StockAdjustmentDialogProps {
    item: any
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function StockAdjustmentDialog({
    item,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onSuccess
}: StockAdjustmentDialogProps) {
    const { profile } = useAuth()
    const [internalOpen, setInternalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = controlledOnOpenChange || setInternalOpen

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StockAdjustmentFormData>({
        resolver: zodResolver(stockAdjustmentSchema),
        defaultValues: {
            type: 'ADJUSTMENT',
            quantity: 1,
            notes: ''
        }
    })

    const type = watch('type')

    const onSubmit = async (data: StockAdjustmentFormData) => {
        if (!item) return

        setIsSubmitting(true)
        try {
            const movementId = uuidv4()

            // Adjust quantity based on type if needed (e.g. DAMAGE is strictly negative)
            // But usually we let the user specify + or - for ADJUSTMENT, 
            // while GRN is always +, DAMAGE/THEFT always -

            let finalQuantity = data.quantity
            if (['DAMAGE', 'THEFT'].includes(data.type) && finalQuantity > 0) {
                finalQuantity = -finalQuantity
            } else if (data.type === 'GRN' && finalQuantity < 0) {
                finalQuantity = -finalQuantity
            }

            const stockMovement = {
                itemId: item.id,
                organizationId: item.organizationId,
                locationId: null, // Default location for now
                type: data.type,
                quantity: finalQuantity,
                referenceType: 'manual_adjustment',
                notes: data.notes,
                createdBy: profile?.id,
                createdAt: new Date().toISOString()
            }

            await queueOperation('stockMovements', 'CREATE', stockMovement, movementId)

            setOpen(false)
            reset()
            onSuccess?.()
        } catch (error) {
            console.error('Failed to save stock movement:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Adjust Stock
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust Stock</DialogTitle>
                    <DialogDescription>
                        Record a stock movement for {item?.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Movement Type</Label>
                        <Select
                            onValueChange={(value) => setValue('type', value as any)}
                            defaultValue="ADJUSTMENT"
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GRN">Goods Received (In)</SelectItem>
                                <SelectItem value="ADJUSTMENT">Correction (+/-)</SelectItem>
                                <SelectItem value="RETURN">Customer Return (In)</SelectItem>
                                <SelectItem value="DAMAGE">Damage (Out)</SelectItem>
                                <SelectItem value="THEFT">Theft/Loss (Out)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            {...register('quantity', { valueAsNumber: true })}
                        />
                        <p className="text-xs text-gray-500">
                            {['DAMAGE', 'THEFT'].includes(type) ? 'Will be recorded as negative stock.' :
                                type === 'GRN' ? 'Will be recorded as positive stock.' :
                                    'Use negative value for stock reduction.'}
                        </p>
                        {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Reason for adjustment..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Adjustment'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
