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
    Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { SaleDetailsModal } from '@/components/sales/SaleDetailsModal'
import { TransactionDialog } from '@/components/shared/TransactionDialog'

export default function SalesHistoryPage() {
    const { user, getToken } = useAuth()
    const [sales, setSales] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)

    // Stats
    const totalSalesAmount = sales.reduce((acc, sale) => acc + Number(sale.totalAmount || 0), 0)
    const totalTransactions = sales.length
    const pendingSales = sales.filter(s => s.paymentStatus !== 'PAID').length

    const fetchSales = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setSales(Array.isArray(data) ? data : [])
            } else {
                toast.error('Failed to fetch sales history')
            }
        } catch (error) {
            console.error('Fetch sales error:', error)
            toast.error('An error occurred while loading sales')
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

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and manage all transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsInvoiceDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Invoice
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchSales} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`TZS ${totalSalesAmount.toLocaleString()}`}
                    icon={CheckCircle2}
                    color="text-green-600 bg-green-50 dark:bg-green-900/20"
                />
                <StatCard
                    title="Total Transactions"
                    value={totalTransactions.toString()}
                    icon={FileText}
                    color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    title="Pending Payments"
                    value={pendingSales.toString()}
                    icon={Clock}
                    color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                />
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by sale number or customer..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Today
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Sale #</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Customer</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                        onClick={() => handleViewDetails(sale)}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {sale.saleNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {sale.customer?.name || 'Walk-in Customer'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                            TZS {Number(sale.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <Badge
                                                variant={sale.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                                                className={
                                                    sale.paymentStatus === 'PAID'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                                }
                                            >
                                                {sale.paymentStatus}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
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

            <TransactionDialog
                type="INVOICE"
                open={isInvoiceDialogOpen}
                onOpenChange={(open) => {
                    setIsInvoiceDialogOpen(open)
                    if (!open) fetchSales() // Refresh after close to show new invoice
                }}
            />
        </div>
    )
}

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
