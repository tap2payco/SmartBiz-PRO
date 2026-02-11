'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    Search,
    Filter,
    ChevronRight,
    Download,
    RefreshCw,
    RotateCcw,
    AlertCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export default function ReturnsHistoryPage() {
    const { user, getToken } = useAuth()
    const [returns, setReturns] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchReturns = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setReturns(Array.isArray(data) ? data : [])
            } else {
                toast.error('Failed to fetch returns history')
            }
        } catch (error) {
            console.error('Fetch returns error:', error)
            toast.error('An error occurred while loading returns')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReturns()
    }, [getToken])

    const filteredReturns = returns.filter(ret =>
        ret.returnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ret.sale?.saleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ret.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const totalRefunded = returns.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0)
    const pendingReturns = returns.filter(r => r.status === 'PENDING').length

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns & Refunds</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage customer returns and track refunds.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchReturns} disabled={isLoading}>
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg text-orange-600 bg-orange-50 dark:bg-orange-900/20">
                            <RotateCcw className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Refunded</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRefunded)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                            <Filter className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Returns</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{returns.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg text-amber-600 bg-amber-50 dark:bg-amber-900/20">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approval</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{pendingReturns}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by return #, sale # or customer..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Return #</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Original Sale</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Customer</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Refund Amount</th>
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
                            ) : filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        No returns found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map((ret) => (
                                    <tr
                                        key={ret.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {format(new Date(ret.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {ret.returnNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {ret.sale?.saleNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {ret.customer?.name || 'Walk-in Customer'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                                            {formatCurrency(Number(ret.totalAmount))}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <Badge
                                                variant={ret.status === 'APPROVED' ? 'default' : 'secondary'}
                                                className={
                                                    ret.status === 'APPROVED' || ret.status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                                        : ret.status === 'REJECTED'
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                                }
                                            >
                                                {ret.status}
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
        </div>
    )
}
