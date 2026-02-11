'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuth } from '@/contexts/AuthContext'
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    CreditCard,
    Banknote,
    Receipt,
    Package
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { queueOperation } from '@/lib/db/ops'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { BarcodeScannerDialog } from '@/components/shared/BarcodeScannerDialog'
import { CheckoutModal } from '@/components/pos/CheckoutModal'
import { Camera } from 'lucide-react'

interface CartItem {
    id: string
    name: string
    sku: string
    price: number
    quantity: number
}

export default function POSPage() {
    const { user, profile, getToken } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [customerId, setCustomerId] = useState<string | undefined>()
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'>('CASH')
    const [organization, setOrganization] = useState<any>(null)
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccountId, setSelectedAccountId] = useState<string>('')
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

    // Fetch organization and accounts locally to be reactive to setup
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            try {
                const token = await getToken()
                if (!token) return

                // Fetch Org
                const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (orgRes.ok) {
                    const data = await orgRes.json()
                    setOrganization(data.organization)
                }

                // Fetch Accounts
                const accRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (accRes.ok) {
                    const data = await accRes.json()
                    const accArray = Array.isArray(data) ? data : []
                    setAccounts(accArray)
                    // Default to first 'CASH' account if available
                    const defaultCash = accArray.find((a: any) => a.type === 'CASH')
                    if (defaultCash) setSelectedAccountId(defaultCash.id)
                }

            } catch (error) {
                console.error('Failed to fetch data in POS:', error)
            }
        }
        fetchData()
    }, [user, getToken])

    // Fetch data from local DB
    const items = useLiveQuery(() =>
        db.items.filter(i =>
            i.isActive && (
                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.sku.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ).toArray()
        , [searchQuery])

    const customers = useLiveQuery(() => db.customers.toArray())

    // Totals Calculation
    const totals = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        const tax = 0 // For now
        const total = subtotal + tax
        return { subtotal, tax, total }
    }, [cart])

    // Handlers
    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id)
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            }
            return [...prev, {
                id: item.id,
                name: item.name,
                sku: item.sku,
                price: Number(item.sellingPrice),
                quantity: 1
            }]
        })
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    // Fetch customer details (credit info) when customerId changes
    useEffect(() => {
        const fetchCustomer = async () => {
            if (!customerId) {
                setSelectedCustomer(null)
                return
            }
            try {
                const token = await getToken()
                if (!token) return
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders/${customerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setSelectedCustomer(data.stakeholder)
                }
            } catch (error) {
                console.error('Failed to fetch customer:', error)
            }
        }
        fetchCustomer()
    }, [customerId, getToken])

    const handleCompleteSale = async (payment: {
        amount: number
        method: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'
        accountId?: string
        reference?: string
    }) => {
        if (cart.length === 0) {
            toast.error('Cart is empty')
            return
        }

        const currentOrgId = profile?.organizationId || organization?.id
        if (!user || !currentOrgId) {
            toast.error('Business setup required')
            return
        }

        const paidAmount = payment.amount
        const isCreditSale = paidAmount < totals.total

        const saleId = uuidv4()
        const saleNumber = `SALE-${Date.now()}`

        const localSale = {
            id: saleId,
            organizationId: currentOrgId,
            saleNumber,
            customerId,
            status: 'COMPLETED' as const,
            paymentStatus: (paidAmount >= totals.total ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING')) as any,
            subtotal: totals.subtotal,
            taxTotal: totals.tax,
            discountTotal: 0,
            totalAmount: totals.total,
            paidAmount: paidAmount,
            createdAt: Date.now(),
            syncedAt: 0
        }

        const localItems = cart.map(item => ({
            id: uuidv4(),
            saleId,
            itemId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            discount: 0,
            tax: 0,
            total: item.price * item.quantity,
            createdAt: Date.now()
        }))

        try {
            await queueOperation('sales', 'CREATE', localSale, saleId)

            await db.outbox.where('localId').equals(saleId).modify({
                data: {
                    ...localSale,
                    items: localItems,
                    payment: {
                        amount: paidAmount,
                        method: payment.method,
                        reference: payment.reference,
                        accountId: payment.accountId || undefined
                    }
                }
            })

            toast.success(isCreditSale ? 'Credit sale recorded!' : 'Sale completed successfully!')
            setCart([])
            setCustomerId(undefined)
        } catch (error) {
            console.error('Failed to save sale:', error)
            toast.error('Failed to complete sale')
        }
    }

    const [isScannerOpen, setIsScannerOpen] = useState(false)

    const handleScan = async (code: string) => {
        try {
            // Find item by barcode (exact match)
            // We use the db directly instead of the filtered 'items' list
            const item = await db.items.where('barcode').equals(code).first()

            if (item) {
                addToCart(item)
                toast.success(`Added ${item.name} to cart`)
            } else {
                toast.error(`Product not found: ${code}`)
            }
        } catch (error) {
            console.error('Scan error:', error)
        }
    }

    // Barcode Scanning (USB)
    useBarcodeScanner({
        onScan: handleScan
    })

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden">
            {/* Left Panel: Product Search & Grid */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products by name or SKU..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items?.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="flex flex-col text-left p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all bg-gray-50 dark:bg-gray-900 group"
                            >
                                <div className="aspect-square bg-white dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center border border-gray-100 dark:border-gray-700 group-hover:scale-105 transition-transform overflow-hidden">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Package className="h-10 w-10 text-gray-300" />
                                    )}
                                </div>
                                <span className="text-sm font-semibold truncate text-gray-900 dark:text-white mb-1">
                                    {item.name}
                                </span>
                                <span className="text-xs text-gray-500 mb-2">{item.sku}</span>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                                        TZS {Number(item.sellingPrice).toLocaleString()}
                                    </span>
                                    <Plus className="h-4 w-4 text-white bg-blue-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Cart & Checkout */}
            <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="font-bold">Current Cart</h2>
                    </div>
                    <Badge variant="secondary">{cart.length} items</Badge>
                </div>

                {/* Customer Selector */}
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <Select value={customerId || 'walk-in'} onValueChange={(val) => setCustomerId(val === 'walk-in' ? undefined : val)}>
                        <SelectTrigger className="h-9 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                <SelectValue placeholder="Walk-in Customer" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                            {customers?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedCustomer && selectedCustomer.creditLimit && (
                        <div className="mt-1 text-xs text-gray-500 flex justify-between">
                            <span>Credit: TZS {Number(selectedCustomer.creditLimit).toLocaleString()}</span>
                            <span className={selectedCustomer.availableCredit > 0 ? 'text-green-600' : 'text-red-500'}>
                                Avail: TZS {(selectedCustomer.availableCredit ?? 0).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2">
                            <ShoppingCart className="h-12 w-12" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                                        {item.price.toLocaleString()} x {item.quantity}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="p-1 hover:text-blue-600"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="px-2 text-xs font-bold w-6 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="p-1 hover:text-blue-600"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>TZS {totals.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-blue-600 dark:text-blue-400">
                                TZS {totals.total.toLocaleString()}
                            </span>
                        </div>
                    </div>


                    {(!profile?.organizationId && !organization) ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                            <p className="font-bold mb-1">Setup Required</p>
                            <p>You need to complete your business setup before you can process and save transactions.</p>
                            <Link href="/onboarding">
                                <Button variant="link" className="p-0 h-auto text-xs text-amber-800 dark:text-amber-300 font-bold underline">
                                    Complete Setup Now
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Button
                            className="w-full py-6 text-lg font-bold"
                            disabled={cart.length === 0}
                            onClick={() => setIsCheckoutOpen(true)}
                        >
                            Checkout (TZS {totals.total.toLocaleString()})
                        </Button>
                    )}
                </div>
            </div>

            <BarcodeScannerDialog
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScan={handleScan}
            />

            <CheckoutModal
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                totalAmount={totals.total}
                cartItemCount={cart.length}
                accounts={accounts}
                selectedCustomer={selectedCustomer}
                onComplete={handleCompleteSale}
            />
        </div>
    )
}
