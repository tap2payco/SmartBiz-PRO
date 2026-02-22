'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Loader2, DollarSign, CreditCard, Banknote, Scan } from 'lucide-react'
import { QRScanner } from './QRScanner'
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
import { toast } from 'sonner'

interface Sale {
    id: string
    saleNumber: string
    totalAmount: string
    paidAmount: string
    balance: number
}

interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
    const { getToken } = useAuth()
    const [customerId, setCustomerId] = useState<string>('')
    const [sales, setSales] = useState<Sale[]>([])
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string>('')
    const [quotes, setQuotes] = useState<any[]>([])
    const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [method, setMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER'>('CASH')
    const [accountId, setAccountId] = useState<string>('')
    const [accounts, setAccounts] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingSales, setIsLoadingSales] = useState(false)

    const customers = useLiveQuery(() => db.customers.toArray())

    // Fetch Accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
                const defaultCash = data.find((a: any) => a.type === 'CASH')
                if (defaultCash) setAccountId(defaultCash.id)
            }
        }
        if (open) fetchAccounts()
    }, [open, getToken])

    // Fetch Sales & Quotes when customer changes
    useEffect(() => {
        const fetchData = async () => {
            if (!customerId) return
            setIsLoadingSales(true)
            try {
                const token = await getToken()
                // Fetch Sales
                const salesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales?customerId=${customerId}&paymentStatus=PENDING,PARTIAL`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (salesRes.ok) {
                    const data = await salesRes.json()
                    const unpaid = data.map((s: any) => ({
                        ...s,
                        balance: Number(s.totalAmount) - Number(s.paidAmount)
                    })).filter((s: any) => s.balance > 0)
                    setSales(unpaid)
                }

                // Fetch Quotes
                const quotesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations?customerId=${customerId}&status=SENT,ACCEPTED`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (quotesRes.ok) {
                    const data = await quotesRes.json()
                    setQuotes(data)
                }
            } catch (error) {
                console.error('Fetch error:', error)
            } finally {
                setIsLoadingSales(false)
            }
        }
        fetchData()
    }, [customerId, getToken])

    const selectedSale = sales.find(s => s.id === selectedSaleId)
    const selectedQuote = quotes.find(q => q.id === selectedQuoteId)

    useEffect(() => {
        if (selectedSale) {
            setAmount(selectedSale.balance.toString())
            setSelectedQuoteId('')
        }
    }, [selectedSale])

    useEffect(() => {
        if (selectedQuote) {
            setAmount(selectedQuote.totalAmount.toString())
            setSelectedSaleId('')
        }
    }, [selectedQuote])

    const handleScan = async (data: string) => {
        try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'SMARTBIZ_SALE') {
                const token = await getToken()
                // Fetch full sale to get customerId
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${parsed.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const saleData = await res.json()
                    setCustomerId(saleData.customerId)
                    setSelectedSaleId(saleData.id)
                    toast.success(`Identified Sale #${saleData.saleNumber}`)
                } else {
                    toast.error('Sale not found in system')
                }
            } else {
                toast.info('Not a SmartBiz Invoice QR')
            }
        } catch (e) {
            toast.error('Invalid QR code')
        }
    }

    const handleSubmit = async () => {
        if (!selectedSaleId && !selectedQuoteId) return toast.error('Please select an invoice or quotation')
        if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount')
        if (!accountId) return toast.error('Please select a deposit account')

        setIsSubmitting(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId,
                    saleId: selectedSaleId || undefined,
                    amount: Number(amount),
                    method,
                    accountId,
                    reference: selectedQuote ? `Quote: ${selectedQuote.quotationNumber}` : undefined,
                    notes: selectedQuote ? `Payment against quote ${selectedQuote.quotationNumber}` : undefined,
                    paymentDate: new Date().toISOString()
                })
            })

            if (res.ok) {
                toast.success('Payment recorded successfully')
                onOpenChange(false)
                resetForm()
            } else {
                const error = await res.json()
                toast.error(error.error || error.message || 'Failed to record payment')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setCustomerId('')
        setSales([])
        setQuotes([])
        setSelectedSaleId('')
        setSelectedQuoteId('')
        setAmount('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Record Customer Payment</DialogTitle>
                    <DialogDescription>Record a payment for an outstanding invoice.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex justify-between">
                            Select Customer
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsScannerOpen(true)}
                                className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Scan className="h-3.5 w-3.5 mr-1" /> Scan Invoice
                            </Button>
                        </Label>
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

                    {customerId && (
                        <div className="space-y-2">
                            <Label>Select Invoice</Label>
                            {isLoadingSales ? (
                                <div className="flex items-center text-sm text-gray-500 italic">
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    Loading unpaid invoices...
                                </div>
                            ) : sales.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No unpaid invoices found.</p>
                            ) : (
                                <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sales.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.saleNumber} - Due: TZS {s.balance.toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {customerId && (
                        <div className="space-y-2">
                            <Label>Select Quotation (Optional)</Label>
                            {isLoadingSales ? (
                                <div className="flex items-center text-sm text-gray-500 italic">
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    Loading quotes...
                                </div>
                            ) : quotes.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No quotes found.</p>
                            ) : (
                                <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Quotation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quotes.map(q => (
                                            <SelectItem key={q.id} value={q.id}>
                                                {q.quotationNumber} - TZS {Number(q.totalAmount).toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {(selectedSaleId || selectedQuoteId) && (
                        <>
                            <div className="space-y-2">
                                <Label>Payment Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">TZS</span>
                                    <Input
                                        type="number"
                                        className="pl-12 font-bold"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Payment Method</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={method === 'CASH' ? 'default' : 'outline'}
                                        onClick={() => setMethod('CASH')}
                                        className="flex gap-2 text-xs"
                                    >
                                        <Banknote className="h-4 w-4" /> Cash
                                    </Button>
                                    <Button
                                        variant={method === 'MOBILE_MONEY' ? 'default' : 'outline'}
                                        onClick={() => setMethod('MOBILE_MONEY')}
                                        className="flex gap-2 text-xs"
                                    >
                                        <CreditCard className="h-4 w-4" /> Mobile
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Deposit To Account</Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <QRScanner
                        open={isScannerOpen}
                        onOpenChange={setIsScannerOpen}
                        onScan={handleScan}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        disabled={isSubmitting || (!selectedSaleId && !selectedQuoteId)}
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
