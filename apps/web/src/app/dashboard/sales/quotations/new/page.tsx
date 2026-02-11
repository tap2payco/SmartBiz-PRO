'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    Search,
    User,
    Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { CustomerSelect } from '@/components/sales/CustomerSelect'
import { ItemSelect } from '@/components/inventory/ItemSelect'

interface QuotationItem {
    itemId: string
    name: string
    quantity: number
    unitPrice: number
    taxRate: number
    stock: number // Just for reference, doesn't block quotes
}

export default function NewQuotationPage() {
    const { getToken } = useAuth()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [customerId, setCustomerId] = useState<string>('')
    const [validUntil, setValidUntil] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [terms, setTerms] = useState('')
    const [items, setItems] = useState<QuotationItem[]>([])

    // Handlers
    const handleAddItem = (item: any) => {
        setItems(prev => {
            const existing = prev.find(i => i.itemId === item.id)
            if (existing) {
                return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            }
            return [...prev, {
                itemId: item.id,
                name: item.name,
                quantity: 1,
                unitPrice: Number(item.sellingPrice),
                taxRate: 0, // Default 0 for now, could be dynamic
                stock: item.stock
            }]
        })
    }

    const updateItemQuantity = (index: number, qty: number) => {
        if (qty < 1) return
        setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item))
    }

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    // Calculations
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const taxTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0)
    const totalAmount = subtotal + taxTotal

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error('Please add at least one item')
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getToken()
            const payload = {
                customerId: customerId || undefined,
                validUntil: validUntil || undefined,
                notes,
                terms,
                items: items.map(i => ({
                    itemId: i.itemId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    taxRate: i.taxRate
                }))
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Quotation created successfully')
                router.push('/dashboard/sales/quotations')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to create quotation')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Quotation</h1>
                        <p className="text-gray-500 text-sm">Create a price estimate for a customer</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Quotation'}
                        <Save className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Customer & Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CustomerSelect
                                onSelect={(customer) => setCustomerId(customer.id)}
                                value={customerId}
                            />
                        </CardContent>
                    </Card>

                    {/* Item Selection */}
                    <Card className="min-h-[400px]">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-blue-600" />
                                Items
                            </CardTitle>
                            <ItemSelect onSelect={handleAddItem} trigger={
                                <Button size="sm" variant="secondary">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            } />
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                    <p className="text-gray-500">No items added yet.</p>
                                    <p className="text-sm text-gray-400">Click "Add Item" to start building the quote.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                                                <p className="text-xs text-gray-500">Unit Price: {formatCurrency(item.unitPrice)}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                                    >
                                                        -
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                                                        className="w-16 h-8 text-center"
                                                        min="1"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                <div className="text-right min-w-[100px]">
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Settings & Totals */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Quote Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valid Until</label>
                                <Input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions</label>
                                <Textarea
                                    placeholder="e.g. Valid for 30 days..."
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    className="h-20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Private Notes</label>
                                <Textarea
                                    placeholder="Internal notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-20"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium text-blue-900 dark:text-blue-100">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm text-blue-800 dark:text-blue-300">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-blue-800 dark:text-blue-300">
                                <span>Tax</span>
                                <span>{formatCurrency(taxTotal)}</span>
                            </div>
                            <div className="border-t border-blue-200 dark:border-blue-800 pt-3 flex justify-between font-bold text-lg text-blue-900 dark:text-white">
                                <span>Total</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
