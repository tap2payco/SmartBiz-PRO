'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    FileText,
    MoreHorizontal,
    ArrowRight,
    Calendar,
    User,
    CheckCircle2,
    XCircle,
    Clock,
    Send
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from 'date-fns'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Quotation } from '@smartbiz/shared'

export default function QuotationsPage() {
    const { user, getToken } = useAuth()
    const router = useRouter()
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchQuotations = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setQuotations(Array.isArray(data) ? data : [])
            } else {
                toast.error('Failed to fetch quotations')
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Error loading quotations')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchQuotations()
    }, [getToken])

    const filteredQuotations = quotations.filter(q =>
        q.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Draft</Badge>
            case 'SENT':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Sent</Badge>
            case 'ACCEPTED':
                return <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">Accepted</Badge>
            case 'CONVERTED':
                return <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200">Converted</Badge>
            case 'REJECTED':
                return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">Rejected</Badge>
            case 'EXPIRED':
                return <Badge variant="outline" className="text-orange-600 border-orange-200">Expired</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const handleConvert = async (id: string) => {
        if (!confirm('Are you sure you want to convert this quotation to a sale? Stock will be deducted.')) return

        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations/${id}/convert`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success('Quotation converted to sale successfully')
                fetchQuotations()
                // Optionally redirect to the new sale
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to convert quotation')
            }
        } catch (error) {
            toast.error('Error converting quotation')
        }
    }

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                toast.success(`Status updated to ${status}`)
                fetchQuotations()
            } else {
                toast.error('Failed to update status')
            }
        } catch (error) {
            toast.error('Error updating status')
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotations</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create and manage estimates for your customers.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/sales/quotations/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Quotation
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search quotations..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Number</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Valid Until</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                            <p className="font-medium">No quotations found</p>
                                            <p className="text-sm mt-1">Create a new quotation to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotations.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {format(new Date(quote.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {quote.quotationNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {quote.customer?.name || 'Walk-in Customer'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {quote.validUntil ? format(new Date(quote.validUntil), 'MMM dd, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                                            {formatCurrency(Number(quote.totalAmount))}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(quote.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/sales/quotations/${quote.id}`)}>
                                                        View Details
                                                    </DropdownMenuItem>

                                                    {quote.status === 'DRAFT' && (
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(quote.id, 'SENT')}>
                                                            <Send className="h-4 w-4 mr-2" /> Mark as Sent
                                                        </DropdownMenuItem>
                                                    )}

                                                    {(quote.status === 'SENT' || quote.status === 'DRAFT') && (
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(quote.id, 'ACCEPTED')}>
                                                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Mark Accepted
                                                        </DropdownMenuItem>
                                                    )}

                                                    {(quote.status === 'SENT' || quote.status === 'DRAFT') && (
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(quote.id, 'REJECTED')}>
                                                            <XCircle className="h-4 w-4 mr-2 text-red-600" /> Mark Rejected
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    {quote.status === 'ACCEPTED' && (
                                                        <DropdownMenuItem onClick={() => handleConvert(quote.id)}>
                                                            <ArrowRight className="h-4 w-4 mr-2 text-purple-600" /> Convert to Sale
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
