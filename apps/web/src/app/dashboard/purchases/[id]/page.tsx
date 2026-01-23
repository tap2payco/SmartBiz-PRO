'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Printer,
    Mail,
    PackageCheck,
    FileText,
    Calendar,
    Building2,
    Ban,
    CheckCircle2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

import { ReceiveStockDialog } from '@/components/purchases/ReceiveStockDialog'
import { printPurchaseOrder } from '@/components/purchases/PurchaseOrderPrint'

export default function PurchaseOrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const [order, setOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showReceiveDialog, setShowReceiveDialog] = useState(false)

    useEffect(() => {
        if (params.id) fetchOrder()
    }, [params.id])

    const fetchOrder = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/orders/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setOrder(data)
            } else {
                toast.error('Failed to load order')
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Error loading order')
        } finally {
            setIsLoading(false)
        }
    }

    const updateStatus = async (newStatus: string) => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/orders/${params.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                toast.success(`Order marked as ${newStatus}`)
                fetchOrder() // Refresh
            } else {
                toast.error('Failed to update status')
            }
        } catch (error) {
            toast.error('Error updating status')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="secondary">Draft</Badge>
            case 'ISSUED': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Issued</Badge>
            case 'PARTIAL_RECEIVED': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Partial</Badge>
            case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Received</Badge>
            case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading order details...</div>
    }

    if (!order) {
        return <div className="p-8 text-center text-red-500">Order not found</div>
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {order.orderNumber}
                            </h1>
                            {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Created on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {order.status === 'DRAFT' && (
                        <Button onClick={() => updateStatus('ISSUED')}>
                            <Mail className="h-4 w-4 mr-2" />
                            Issue Order
                        </Button>
                    )}
                    {(order.status === 'ISSUED' || order.status === 'PARTIAL_RECEIVED') && (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setShowReceiveDialog(true)}
                        >
                            <PackageCheck className="h-4 w-4 mr-2" />
                            Receive Stock
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => printPurchaseOrder(order)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print / PDF
                    </Button>
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                        <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatus('CANCELLED')}>
                            <Ban className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Ordered</TableHead>
                                        <TableHead className="text-right">Received</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.lines.map((line: any) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="font-medium">
                                                {line.item.name}
                                                <div className="text-xs text-gray-500">{line.item.sku}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{line.quantity}</TableCell>
                                            <TableCell className="text-right">
                                                {line.receivedQuantity > 0 ? (
                                                    <span className="text-green-600 font-medium">{line.receivedQuantity}</span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(line.unitCost))}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(Number(line.totalCost))}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                        <TableCell colSpan={4} className="text-right font-bold">Total Amount</TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            {formatCurrency(Number(order.totalAmount))}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Received History (GRNs) */}
                    {order.grns && order.grns.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Receipt History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.grns.map((grn: any) => (
                                        <div key={grn.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-medium">{grn.grnNumber}</div>
                                                <div className="text-sm text-gray-500">{new Date(grn.receivedDate).toLocaleDateString()}</div>
                                            </div>
                                            <Badge variant="outline">{grn.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-gray-500">Supplier Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{order.supplier.name}</div>
                                    <div className="text-sm text-gray-500">{order.supplier.email}</div>
                                    <div className="text-sm text-gray-500">{order.supplier.phone}</div>
                                    {order.supplier.address && (
                                        <div className="text-sm text-gray-500 mt-1">{order.supplier.address}</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-gray-500">Order Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="text-xs text-gray-500">Expected Delivery</div>
                                <div className="font-medium">
                                    {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not set'}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-xs text-gray-500">Notes</div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                    {order.notes || 'No notes provided.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ReceiveStockDialog
                open={showReceiveDialog}
                onOpenChange={setShowReceiveDialog}
                order={order}
                onSuccess={() => {
                    fetchOrder()
                    toast.success('Stock updated!')
                }}
            />
        </div>
    )
}
