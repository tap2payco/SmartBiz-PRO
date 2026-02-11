'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
    ArrowLeft,
    Printer,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Send,
    FileText,
    Calendar,
    User,
    Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Quotation } from '@smartbiz/shared'

export default function QuotationDetailsPage() {
    const { id } = useParams()
    const { getToken } = useAuth()
    const router = useRouter()
    const [quotation, setQuotation] = useState<Quotation | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchQuotation = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setQuotation(data)
            } else {
                toast.error('Failed to load quotation')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (id) fetchQuotation()
    }, [id, getToken])

    const handleStatusUpdate = async (status: string) => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                toast.success(`Status updated to ${status}`)
                fetchQuotation()
            } else {
                toast.error('Failed to update status')
            }
        } catch (error) {
            toast.error('Error updating status')
        }
    }

    const handleConvert = async () => {
        if (!confirm('Convert this quotation to a sale? Inventory will be deducted.')) return

        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotations/${id}/convert`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success('Converted to sale successfully')
                const sale = await res.json()
                // router.push(`/dashboard/sales/${sale.id}`) // Assuming we have a sale details page link? 
                // For now go back to list
                router.push('/dashboard/sales/quotations')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to convert')
            }
        } catch (error) {
            toast.error('Error converting quotation')
        }
    }

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>
    if (!quotation) return <div className="p-8 text-center text-red-500">Quotation not found</div>

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Draft</Badge>
            case 'SENT': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Sent</Badge>
            case 'ACCEPTED': return <Badge variant="default" className="bg-green-100 text-green-700">Accepted</Badge>
            case 'CONVERTED': return <Badge variant="default" className="bg-purple-100 text-purple-700">Converted</Badge>
            case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-700">Rejected</Badge>
            case 'EXPIRED': return <Badge variant="outline" className="text-orange-600 border-orange-200">Expired</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-5xl mx-auto">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quotation.quotationNumber}</h1>
                            {getStatusBadge(quotation.status)}
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            Created on {format(new Date(quotation.createdAt), 'MMMM dd, yyyy')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>

                    {quotation.status === 'DRAFT' && (
                        <Button variant="secondary" onClick={() => handleStatusUpdate('SENT')}>
                            <Send className="h-4 w-4 mr-2" />
                            Mark Sent
                        </Button>
                    )}

                    {(quotation.status === 'SENT' || quotation.status === 'DRAFT') && (
                        <>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate('REJECTED')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate('ACCEPTED')}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accept
                            </Button>
                        </>
                    )}

                    {quotation.status === 'ACCEPTED' && (
                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleConvert}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Convert to Sale
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-gray-50 dark:bg-gray-900/50 pb-4">
                            <CardTitle className="text-base font-medium flex items-center justify-between">
                                <span>Items</span>
                                <span className="text-sm font-normal text-gray-500">{quotation.items?.length} items</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Description</th>
                                        <th className="px-6 py-3 font-medium text-right">Price</th>
                                        <th className="px-6 py-3 font-medium text-center">Qty</th>
                                        <th className="px-6 py-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {quotation.items?.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">{item.item?.name}</p>
                                                <p className="text-xs text-gray-500">{item.item?.sku}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                {formatCurrency(Number(item.unitPrice))}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm">
                                                {Number(item.quantity)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(Number(item.total))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {quotation.notes && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{quotation.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                    {quotation.terms && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Terms & Conditions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm">{quotation.terms}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Customer & Totals */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                {quotation.customer?.name || 'Walk-in Customer'}
                            </p>
                            {quotation.customer?.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                    <Mail className="h-3 w-3" />
                                    {quotation.customer.email}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                        <CardContent className="pt-6 space-y-3">
                            <div className="flex justify-between text-sm text-blue-800 dark:text-blue-300">
                                <span>Subtotal</span>
                                <span>{formatCurrency(Number(quotation.subtotal))}</span>
                            </div>
                            <div className="flex justify-between text-sm text-blue-800 dark:text-blue-300">
                                <span>Tax</span>
                                <span>{formatCurrency(Number(quotation.taxTotal))}</span>
                            </div>
                            <Separator className="bg-blue-200 dark:bg-blue-800" />
                            <div className="flex justify-between font-bold text-lg text-blue-900 dark:text-white">
                                <span>Grand Total</span>
                                <span>{formatCurrency(Number(quotation.totalAmount))}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-xs text-gray-400 text-center">
                        Quotations are valid until {quotation.validUntil ? format(new Date(quotation.validUntil), 'MMM dd, yyyy') : 'revoked'}.
                    </div>
                </div>
            </div>
        </div>
    )
}
