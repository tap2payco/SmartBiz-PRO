'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Truck, ArrowRightLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { format } from 'date-fns'

interface Transfer {
    id: string
    transferNumber: string
    sourceLocation: { name: string }
    destinationLocation: { name: string }
    status: 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
    items: { quantitySent: number }[]
    createdAt: string
    sentAt?: string
    receivedAt?: string
}

export default function StockTransfersPage() {
    const { getToken } = useAuth()
    const [transfers, setTransfers] = useState<Transfer[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchTransfers()
    }, [])

    const fetchTransfers = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTransfers(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-gray-100 text-gray-800'
            case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800'
            case 'COMPLETED': return 'bg-green-100 text-green-800'
            case 'CANCELLED': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredTransfers = transfers.filter(t =>
        t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sourceLocation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destinationLocation.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Transfers</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage inventory movement between locations</p>
                </div>
                <Link href="/dashboard/inventory/transfers/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Transfer
                    </Button>
                </Link>
            </div>

            <div className="flex bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search transfers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTransfers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No transfers found.
                                </td>
                            </tr>
                        ) : filteredTransfers.map((transfer) => (
                            <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => window.location.href = `/dashboard/inventory/transfers/${transfer.id}`}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                                    {transfer.transferNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                        <span>{transfer.sourceLocation.name}</span>
                                        <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                                        <span>{transfer.destinationLocation.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge className={getStatusColor(transfer.status)} variant="outline">
                                        {transfer.status.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(transfer.createdAt), 'MMM dd, yyyy')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {transfer.items.length} items
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
