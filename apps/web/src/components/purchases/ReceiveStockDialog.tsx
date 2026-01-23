'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, PackageCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface ReceiveStockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: any
    onSuccess: () => void
}

export function ReceiveStockDialog({ open, onOpenChange, order, onSuccess }: ReceiveStockDialogProps) {
    const { getToken } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})

    const handleQuantityChange = (itemId: string, value: number) => {
        setReceivedQuantities(prev => ({
            ...prev,
            [itemId]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Filter out items with 0 received
        const itemsToReceive = order.lines.map((line: any) => ({
            lineId: line.id,
            itemId: line.item.id,
            quantity: receivedQuantities[line.item.id] || 0
        })).filter((item: any) => item.quantity > 0)

        if (itemsToReceive.length === 0) {
            toast.error('Please enter quantities to receive')
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/orders/${order.id}/receive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: itemsToReceive })
            })

            if (res.ok) {
                toast.success('Stock received successfully')
                onOpenChange(false)
                onSuccess()
            } else {
                const error = await res.json()
                toast.error(error.message || 'Failed to receive stock')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Receive Stock</DialogTitle>
                    <DialogDescription>
                        Confirm quantities received for PO {order?.orderNumber}. Inventory will be updated automatically.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {order?.lines.map((line: any) => {
                            const remaining = line.quantity - line.receivedQuantity
                            if (remaining <= 0) return null

                            return (
                                <div key={line.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{line.item.name}</div>
                                        <div className="text-xs text-gray-500">Ordered: {line.quantity} | Received: {line.receivedQuantity}</div>
                                    </div>
                                    <div className="w-32">
                                        <Label className="text-xs">Receive Now</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={remaining}
                                            placeholder={`Max ${remaining}`}
                                            onChange={(e) => handleQuantityChange(line.item.id, parseInt(e.target.value) || 0)}
                                            className="h-8 mt-1"
                                        />
                                    </div>
                                </div>
                            )
                        })}

                        {order?.lines.every((l: any) => l.quantity - l.receivedQuantity <= 0) && (
                            <div className="text-center text-green-600 py-4">
                                This order has been fully received!
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || order?.lines.every((l: any) => l.quantity - l.receivedQuantity <= 0)}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Confirm Receipt'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
