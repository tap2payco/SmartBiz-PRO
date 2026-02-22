'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    Search,
    Filter,
    ChevronRight,
    Download,
    Calendar as CalendarIcon,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    DollarSign,
    Plus
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { SaleDetailsModal } from '@/components/sales/SaleDetailsModal'
import { TransactionDialog } from '@/components/shared/TransactionDialog'

export default function AccountsReceivablePage() {
    const { user, getToken } = useAuth()
    const [sales, setSales] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)

    // Stats
    const totalReceivable = sales
        .filter(s => s.paymentStatus !== 'PAID')
        .reduce((acc, sale) => acc + (Number(sale.totalAmount) - Number(sale.paidAmount)), 0)

    const overdueAmount = sales
        .filter(s => s.paymentStatus !== 'PAID' && s.dueDate && new Date(s.dueDate) < new Date())
        .reduce((acc, sale) => acc + (Number(sale.totalAmount) - Number(sale.paidAmount)), 0)

    const pendingInvoices = sales.filter(s => s.paymentStatus !== 'PAID').length

    const fetchSales = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('Please log in to view invoices')
                setIsLoading(false)
                return
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL
            if (!apiUrl) {
                toast.error('API URL not configured')
                setIsLoading(false)
                return
            }

            const res = await fetch(`${apiUrl}/sales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                // Filter only sales with outstanding balance
                const salesArray = Array.isArray(data) ? data : []
                const unpaid = salesArray.filter((s: any) => s.paymentStatus !== 'PAID')
                setSales(unpaid)
            } else {
                const errText = await res.text().catch(() => 'Unknown error')
                console.error('Fetch invoices failed:', res.status, errText)
                toast.error(`Failed to fetch invoices (${res.status})`)
            }
        } catch (error: any) {
            console.error('Fetch sales error:', error)
            toast.error(error?.message || 'Network error loading invoices')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSales()
    }, [getToken])

    const filteredSales = sales.filter(sale =>
        sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleViewDetails = (sale: any) => {
        setSelectedSale(sale)
        setIsDetailsOpen(true)
    }

    const getDaysOverdue = (dueDate: string) => {
        if (!dueDate) return 0
        const diff = new Date().getTime() - new Date(dueDate).getTime()
        return Math.floor(diff / (1000 * 3600 * 24))
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts Receivable</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage outstanding invoices and collect payments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Quick Invoice
                    </Button>
                    <Link href="/dashboard/sales/invoices/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Invoice
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={fetchSales} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Receivable"
                    value={`TZS ${totalReceivable.toLocaleString()}`}
                    icon={DollarSign}
                    color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    title="Overdue Amount"
                    value={`TZS ${overdueAmount.toLocaleString()}`}
                    icon={AlertCircle}
                    color="text-red-600 bg-red-50 dark:bg-red-900/20"
                />
                <StatCard
                    title="Open Invoices"
                    value={pendingInvoices.toString()}
                    icon={FileText}
                    color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                />
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by invoice # or customer..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Invoice #</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Customer</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Balance Due</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        No outstanding invoices found. Good job!
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => {
                                    const balance = Number(sale.totalAmount) - Number(sale.paidAmount)
                                    const isOverdue = sale.dueDate && new Date(sale.dueDate) < new Date()
                                    const daysOverdue = isOverdue ? getDaysOverdue(sale.dueDate) : 0

                                    return (
                                        <tr
                                            key={sale.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                            onClick={() => handleViewDetails(sale)}
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {sale.dueDate ? (
                                                    <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                                        {format(new Date(sale.dueDate), 'MMM dd, yyyy')}
                                                        {isOverdue && daysOverdue > 0 && (
                                                            <span className="text-xs ml-1">({daysOverdue}d overdue)</span>
                                                        )}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {sale.saleNumber}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {sale.customer?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {Number(sale.totalAmount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                TZS {balance.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        isOverdue
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                                    }
                                                >
                                                    {isOverdue ? 'OVERDUE' : sale.paymentStatus}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedSale(sale)
                                                        setIsPaymentModalOpen(true)
                                                    }}
                                                >
                                                    Collect Payment
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSale && (
                <SaleDetailsModal
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    sale={selectedSale}
                />
            )}

            {selectedSale && (
                <PaymentCollectionModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    sale={selectedSale}
                    onPaymentComplete={fetchSales}
                />
            )}

            <TransactionDialog
                type="INVOICE"
                open={isInvoiceDialogOpen}
                onOpenChange={(open) => {
                    setIsInvoiceDialogOpen(open)
                    if (!open) fetchSales()
                }}
            />
        </div>
    )
}

import { PaymentCollectionModal } from '@/components/sales/PaymentCollectionModal'

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    )
}
