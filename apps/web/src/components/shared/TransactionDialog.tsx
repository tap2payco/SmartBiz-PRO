'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Plus, Trash2, Search, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { queueOperation } from '@/lib/db/ops'

interface TransactionItem {
    id: string
    itemId: string
    name: string
    quantity: number
    unitPrice: number
    total: number
}

interface TransactionDialogProps {
    type: 'INVOICE' | 'QUOTE'
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TransactionDialog({ type, open, onOpenChange }: TransactionDialogProps) {
    const { getToken, profile } = useAuth()
    const [customerId, setCustomerId] = useState<string>('')
    const [items, setItems] = useState<TransactionItem[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch data from local DB
    const customers = useLiveQuery(() => db.customers.toArray())
    const availableItems = useLiveQuery(() =>
        db.items.filter(i =>
            i.isActive && (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        ).limit(10).toArray()
        , [searchQuery])

    // Totals
    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0)
        // Note: In a real app, this should come from org settings
        // Defaulting to 18% as specified in the business requirements for TZ
        const taxRate = 18
        const taxTotal = subtotal * (taxRate / 100)
        return {
            subtotal,
            taxTotal,
            total: subtotal + taxTotal
        }
    }, [items, profile])

    const addItem = (item: any) => {
        const existing = items.find(i => i.itemId === item.id)
        if (existing) {
            updateQuantity(existing.id, existing.quantity + 1)
        } else {
            const newItem: TransactionItem = {
                id: uuidv4(),
                itemId: item.id,
                name: item.name,
                quantity: 1,
                unitPrice: Number(item.sellingPrice),
                total: Number(item.sellingPrice)
            }
            setItems([...items, newItem])
        }
        setSearchQuery('')
    }

    const updateQuantity = (id: string, qty: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const quantity = Math.max(1, qty)
                return { ...item, quantity, total: quantity * item.unitPrice }
            }
            return item
        }))
    }

    const updatePrice = (id: string, price: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, unitPrice: price, total: item.quantity * price }
            }
            return item
        }))
    }

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }

    const handleSubmit = async () => {
        if (!customerId) return toast.error('Please select a customer')
        if (items.length === 0) return toast.error('Please add at least one item')

        setIsSubmitting(true)
        try {
            const token = await getToken()
            const payload = {
                customerId,
                items: items.map(i => ({
                    itemId: i.itemId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    taxRate: 18 // Default to 18%
                }))
            }

            const endpoint = type === 'INVOICE' ? 'sales' : 'quotations'
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(`${type === 'INVOICE' ? 'Invoice' : 'Quote'} created successfully`)
                onOpenChange(false)
                setItems([])
                setCustomerId('')
            } else {
                toast.error('Failed to create transaction')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New {type === 'INVOICE' ? 'Invoice' : 'Quote'}</DialogTitle>
                    <DialogDescription>Quickly record a business transaction.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Customer</Label>
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers?.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Item Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search items..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && availableItems && availableItems.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {availableItems.map(item => (
                                            <button
                                                key={item.id}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                                                onClick={() => addItem(item)}
                                            >
                                                <span>{item.name}</span>
                                                <span className="text-sm font-bold">TZS {Number(item.sellingPrice).toLocaleString()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="w-24">Qty</TableHead>
                                    <TableHead className="w-32">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No items added yet. Search above to add.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.total.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>


                    <div className="flex flex-col items-end gap-2 pr-4">
                        <div className="flex justify-between w-64 text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>TZS {totals.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-64 text-sm">
                            <span className="text-muted-foreground">Tax (18%)</span>
                            <span>TZS {totals.taxTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-64 font-bold text-lg border-t pt-2">
                            <span>Total</span>
                            <span className="text-blue-600">TZS {totals.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save {type === 'INVOICE' ? 'Invoice' : 'Quote'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
