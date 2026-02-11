'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Calendar as CalendarIcon, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import { ItemSelect } from '@/components/inventory/ItemSelect'
import { CustomerSelect } from '@/components/sales/CustomerSelect'

interface InvoiceLine {
    itemId: string
    itemName: string
    quantity: number
    unitPrice: number
    total: number
}

export default function CreateInvoicePage() {
    const router = useRouter()
    const { getToken, user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [customerId, setCustomerId] = useState('')
    const [notes, setNotes] = useState('')
    const [lines, setLines] = useState<InvoiceLine[]>([])

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
            unitPrice: item.sellingPrice ? Number(item.sellingPrice) : 0,
            total: item.sellingPrice ? Number(item.sellingPrice) : 0
        }])
    }

    const updateLine = (index: number, field: keyof InvoiceLine, value: number) => {
        setLines(prev => prev.map((line, i) => {
            if (i !== index) return line

            const updated = { ...line, [field]: value }

            // Recalculate total
            if (field === 'quantity' || field === 'unitPrice') {
                updated.total = updated.quantity * updated.unitPrice
            }

            return updated
        }))
    }

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index))
    }

    const grandTotal = lines.reduce((acc, line) => acc + line.total, 0)

    const handleSubmit = async () => {
        if (!customerId) {
            toast.error('Please select a customer')
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
                customerId,
                items: lines.map(line => ({
                    itemId: line.itemId,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    discount: 0,
                    tax: 0
                })),
                payment: {
                    amount: 0, // 0 payment = Credit Sale (Invoice)
                    method: 'CREDIT',
                    accountId: undefined
                },
                notes
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Invoice created successfully')
                router.push('/dashboard/sales/invoices')
            } else {
                const errorData = await res.json().catch(() => ({}))
                toast.error(errorData.error || 'Failed to create invoice')
            }
        } catch (error) {
            console.error('Submit Invoice Error:', error)
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
                    <h1 className="text-2xl font-bold tracking-tight">Create New Invoice</h1>
                    <p className="text-muted-foreground">Create a credit sale for a customer</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Form Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Invoice Items</h2>
                        </div>

                        <div className="w-full max-w-md">
                            <ItemSelect onSelect={addLine} />
                        </div>

                        <div className="rounded-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-24">Qty</TableHead>
                                        <TableHead className="w-32">Price</TableHead>
                                        <TableHead className="w-32 text-right">Total</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No items added
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lines.map((line, index) => (
                                            <TableRow key={line.itemId}>
                                                <TableCell className="font-medium">{line.itemName}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="h-8 w-20"
                                                        value={line.quantity}
                                                        onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-8 w-28"
                                                        value={line.unitPrice}
                                                        onChange={(e) => updateLine(index, 'unitPrice', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {line.total.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        </div>

                        {lines.length > 0 && (
                            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="space-y-1 text-right">
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        TZS {grandTotal.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Customer & Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                        <h2 className="font-semibold">Customer Details</h2>

                        <div className="space-y-2">
                            <Label>Customer <span className="text-red-500">*</span></Label>
                            <CustomerSelect
                                value={customerId}
                                onSelect={(c) => setCustomerId(c.id)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Invoice notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="resize-none h-24"
                            />
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full font-bold"
                        onClick={handleSubmit}
                        disabled={isLoading || lines.length === 0 || !customerId}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Invoice
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
