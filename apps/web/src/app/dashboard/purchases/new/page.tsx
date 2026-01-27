'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { ItemSelect } from '@/components/inventory/ItemSelect'
import { SupplierSelect } from '@/components/purchases/SupplierSelect'

interface OrderLine {
    itemId: string
    itemName: string
    quantity: number
    unitCost: number
    totalCost: number
}

export default function CreatePurchaseOrderPage() {
    const router = useRouter()
    const { getToken, user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [supplierId, setSupplierId] = useState('')
    const [expectedDate, setExpectedDate] = useState('')
    const [notes, setNotes] = useState('')
    const [lines, setLines] = useState<OrderLine[]>([])

    // Add Line Logic
    const addLine = (item: any) => {
        // Check if exists
        if (lines.find(l => l.itemId === item.id)) {
            toast.error('Item already added')
            return
        }

        setLines([...lines, {
            itemId: item.id,
            itemName: item.name,
            quantity: 1,
            unitCost: item.costPrice ? Number(item.costPrice) : 0,
            totalCost: item.costPrice ? Number(item.costPrice) : 0
        }])
    }

    const updateLine = (index: number, field: keyof OrderLine, value: number) => {
        setLines(prev => prev.map((line, i) => {
            if (i !== index) return line

            const updated = { ...line, [field]: value }

            // Recalculate total
            if (field === 'quantity' || field === 'unitCost') {
                updated.totalCost = updated.quantity * updated.unitCost
            }

            return updated
        }))
    }

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index))
    }

    const grandTotal = lines.reduce((acc, line) => acc + line.totalCost, 0)

    const handleSubmit = async () => {
        if (!supplierId) {
            toast.error('Please select a supplier')
            return
        }
        if (lines.length === 0) {
            toast.error('Please add at least one item')
            return
        }

        setIsLoading(true)
        try {
            const token = await getToken()
            const payload = {
                supplierId,
                expectedDeliveryDate: expectedDate || null,
                notes,
                items: lines
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Purchase Order created successfully')
                router.push('/dashboard/purchases')
            } else {
                toast.error('Failed to create order')
            }
        } catch (error) {
            console.error('Submit PO Error:', error)
            toast.error('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Purchase Order</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Draft new order for supplier</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form & Lines */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <SupplierSelect
                                        value={supplierId}
                                        onSelect={(s) => setSupplierId(s.id)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected Delivery</Label>
                                    <Input
                                        type="date"
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="Enter any special instructions..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Items</CardTitle>
                            <div className="w-[250px]">
                                <ItemSelect onSelect={addLine} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Item</TableHead>
                                        <TableHead className="w-[20%]">Quantity</TableHead>
                                        <TableHead className="w-[20%]">Unit Cost</TableHead>
                                        <TableHead className="w-[15%] text-right">Total</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                                No items added. Search above to add items.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lines.map((line, index) => (
                                            <TableRow key={line.itemId}>
                                                <TableCell className="font-medium">
                                                    {line.itemName}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={line.quantity}
                                                        onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={line.unitCost}
                                                        onChange={(e) => updateLine(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(line.totalCost)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => removeLine(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Subtotal ({lines.length} items)</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span>{formatCurrency(0)}</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>

                            <Button
                                className="w-full h-12 text-lg"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Create Order'
                                )}
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                        <CardContent className="p-4 flex gap-3">
                            <Loader2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-semibold">Workflow Tip</p>
                                <p className="mt-1">
                                    Creating this order will set it to DRAFT. You can review and email it to the supplier before marking it as ISSUED.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
