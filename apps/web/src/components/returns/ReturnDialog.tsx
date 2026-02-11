'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface ReturnDialogProps {
    isOpen: boolean
    onClose: () => void
    sale: any
    onSuccess: () => void
}

interface ReturnItemState {
    itemId: string
    quantity: number
    condition: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'OTHER'
    reason: string
    restock: boolean
    maxQuantity: number
    unitPrice: number
    itemName: string
    selected: boolean
}

export function ReturnDialog({ isOpen, onClose, sale, onSuccess }: ReturnDialogProps) {
    const { getToken } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generalReason, setGeneralReason] = useState('')

    // Initialize state from sale items
    const [returnItems, setReturnItems] = useState<ReturnItemState[]>(() =>
        sale?.items?.map((item: any) => ({
            itemId: item.itemId,
            quantity: 1, // Default to 1
            condition: 'GOOD',
            reason: '',
            restock: true, // Default to restock if good
            maxQuantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice), // Use raw unit price
            itemName: item.item?.name || 'Unknown Item',
            selected: false
        })) || []
    )

    const handleItemChange = (index: number, field: keyof ReturnItemState, value: any) => {
        const newItems = [...returnItems]
        newItems[index] = { ...newItems[index], [field]: value }

        // Auto-set restock based on condition
        if (field === 'condition') {
            if (value === 'GOOD') {
                newItems[index].restock = true
            } else {
                newItems[index].restock = false
            }
        }

        setReturnItems(newItems)
    }

    const toggleItemSelection = (index: number) => {
        const newItems = [...returnItems]
        newItems[index].selected = !newItems[index].selected
        setReturnItems(newItems)
    }

    const selectedItems = returnItems.filter(i => i.selected)
    const totalRefundAmount = selectedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            toast.error("Please select at least one item to return")
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getToken()

            const payload = {
                saleId: sale.id,
                reason: generalReason,
                items: selectedItems.map(item => ({
                    itemId: item.itemId,
                    quantity: Number(item.quantity),
                    condition: item.condition,
                    reason: item.reason,
                    restock: item.restock
                }))
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to process return')
            }

            toast.success("Return processed successfully")
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Return error:', error)
            toast.error(error.message || "An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!sale) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Return / Refund</DialogTitle>
                    <DialogDescription>
                        Select items to return from Sale #{sale.saleNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Items Table */}
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-3 w-[40px]"></th>
                                    <th className="p-3 text-left">Item</th>
                                    <th className="p-3 text-right">Sold Qty</th>
                                    <th className="p-3 text-center">Return Qty</th>
                                    <th className="p-3 text-left">Condition</th>
                                    <th className="p-3 text-center">Restock?</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {returnItems.map((item, index) => (
                                    <tr key={item.itemId} className={item.selected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                                        <td className="p-3 text-center">
                                            <Checkbox
                                                checked={item.selected}
                                                onCheckedChange={() => toggleItemSelection(index)}
                                            />
                                        </td>
                                        <td className="p-3 font-medium">
                                            {item.itemName}
                                            <div className="text-xs text-muted-foreground">
                                                {formatCurrency(item.unitPrice)} each
                                            </div>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground">
                                            {item.maxQuantity}
                                        </td>
                                        <td className="p-3">
                                            <Input
                                                type="number"
                                                min="1"
                                                max={item.maxQuantity}
                                                className="w-20 text-center mx-auto h-8"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                disabled={!item.selected}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <Select
                                                value={item.condition}
                                                onValueChange={(val) => handleItemChange(index, 'condition', val)}
                                                disabled={!item.selected}
                                            >
                                                <SelectTrigger className="w-[110px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GOOD">Good</SelectItem>
                                                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                                                    <SelectItem value="EXPIRED">Expired</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Checkbox
                                                checked={item.restock}
                                                onCheckedChange={(checked) => handleItemChange(index, 'restock', checked)}
                                                disabled={!item.selected}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">General Reason / Notes</label>
                            <Textarea
                                placeholder="Why is the customer returning these items?"
                                value={generalReason}
                                onChange={(e) => setGeneralReason(e.target.value)}
                            />
                        </div>
                        <div className="w-[250px] bg-muted/30 p-4 rounded-lg space-y-2 border">
                            <div className="flex justify-between text-sm">
                                <span>Items Selected:</span>
                                <span className="font-medium">{selectedItems.length}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t">
                                <span>Refund Total:</span>
                                <span className="text-blue-600">{formatCurrency(totalRefundAmount)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground pt-2">
                                * Refunds will be recorded as PENDING until approved.
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedItems.length === 0}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Confirm Return'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
