'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Plus,
    DollarSign,
    Search,
    RefreshCw,
    Download,
    CreditCard,
    Banknote,
    History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { PaymentDialog } from '@/components/shared/PaymentDialog'

export default function PaymentsHistoryPage() {
    const { user, getToken } = useAuth()
    const router = useRouter()
    const [payments, setPayments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

    const fetchPayments = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            // We'll fetch from a general payments endpoint or sales payments
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/payments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setPayments(Array.isArray(data) ? data : [])
            } else {
                toast.error('Failed to fetch payment history')
            }
        } catch (error) {
            console.error('Fetch payments error:', error)
            toast.error('Error loading payments')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [getToken])

    const filteredPayments = payments.filter(p =>
        (p.sale?.saleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'CASH': return <Banknote className="h-4 w-4" />
            case 'CARD': return <CreditCard className="h-4 w-4" />
            default: return <DollarSign className="h-4 w-4" />
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/finance')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Payment History</h1>
                        <p className="text-muted-foreground">View all customer receipts and payments.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsPaymentDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                    </Button>
                    <Button variant="outline" onClick={fetchPayments} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="p-4 bg-white dark:bg-gray-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by customer, sale # or reference..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </Card>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-sm font-semibold border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading payments...</td></tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                        <p>No payments recorded yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 text-sm">
                                            {format(new Date(p.paymentDate || p.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {p.customer?.name || 'Walk-in'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="text-blue-600 font-mono text-xs">{p.sale?.saleNumber || p.reference || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="flex items-center bg-gray-50 gap-1 w-fit">
                                                {getMethodIcon(p.method)}
                                                {p.method}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            TZS {Number(p.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">SUCCESS</Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentDialog
                open={isPaymentDialogOpen}
                onOpenChange={(open) => {
                    setIsPaymentDialogOpen(open)
                    if (!open) fetchPayments()
                }}
            />
        </div>
    )
}
