'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Truck, CheckCircle, Printer, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function TransferDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const [transfer, setTransfer] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({})

    useEffect(() => {
        fetchTransfer()
    }, [id])

    const fetchTransfer = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfers/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTransfer(data)
                // Initialize receive quantities
                const initialQty: Record<string, number> = {}
                data.items.forEach((item: any) => {
                    initialQty[item.itemId] = item.quantitySent
                })
                setReceiveQuantities(initialQty)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to load transfer details')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendTransfer = async () => {
        if (!confirm('Are you sure you want to mark this transfer as sent? Stock will be deducted from the source location.')) return

        setIsActionLoading(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfers/${id}/send`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success('Transfer marked as In Transit')
                fetchTransfer()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to send transfer')
            }
        } catch (error) {
            toast.error('Error sending transfer')
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleReceiveTransfer = async () => {
        if (!confirm('Are you sure you want to receive this stock? Stock will be added to the destination location.')) return

        setIsActionLoading(true)
        try {
            const itemsToReceive = transfer.items.map((item: any) => ({
                itemId: item.itemId,
                quantityReceived: receiveQuantities[item.itemId] || 0
            }))

            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfers/${id}/receive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: itemsToReceive })
            })

            if (res.ok) {
                toast.success('Transfer completed successfully')
                fetchTransfer()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to receive transfer')
            }
        } catch (error) {
            toast.error('Error receiving transfer')
        } finally {
            setIsActionLoading(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!transfer) return <div>Transfer not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {transfer.transferNumber}
                        <Badge variant="outline" className={
                            transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                transfer.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                        }>
                            {transfer.status.replace('_', ' ')}
                        </Badge>
                    </h1>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Waybill
                    </Button>

                    {transfer.status === 'DRAFT' && (
                        <Button onClick={handleSendTransfer} disabled={isActionLoading}>
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                            Mark as Sent
                        </Button>
                    )}

                    {transfer.status === 'IN_TRANSIT' && (
                        <Button onClick={handleReceiveTransfer} disabled={isActionLoading} className="bg-green-600 hover:bg-green-700">
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Receive Stock
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Transfer Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between font-semibold text-sm text-gray-500 border-b pb-2">
                                <span>Item</span>
                                <div className="flex gap-8">
                                    <span className="w-20 text-right">Sent</span>
                                    {transfer.status !== 'DRAFT' && <span className="w-20 text-right">Received</span>}
                                </div>
                            </div>
                            {transfer.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center py-2">
                                    <div>
                                        <div className="font-medium">{item.item.name}</div>
                                        <div className="text-xs text-gray-500">{item.item.sku}</div>
                                    </div>
                                    <div className="flex gap-8 items-center">
                                        <span className="w-20 text-right">{item.quantitySent}</span>
                                        {transfer.status !== 'DRAFT' && (
                                            <div className="w-20 text-right">
                                                {transfer.status === 'COMPLETED' ? (
                                                    <span className={item.quantityReceived !== item.quantitySent ? 'text-red-600 font-bold' : 'text-green-600'}>
                                                        {item.quantityReceived}
                                                    </span>
                                                ) : (
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-20 text-right"
                                                        value={receiveQuantities[item.itemId] ?? 0}
                                                        onChange={(e) => setReceiveQuantities(prev => ({ ...prev, [item.itemId]: parseInt(e.target.value) || 0 }))}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-gray-500">Route Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-medium text-sm text-gray-500">From (Source)</h4>
                                <p className="font-semibold text-lg">{transfer.sourceLocation.name}</p>
                                <p className="text-sm text-gray-500">{transfer.sourceLocation.address || 'No address'}</p>
                            </div>
                            <div className="flex justify-center">
                                <ArrowRight className="text-gray-300 transform rotate-90 md:rotate-0" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-gray-500">To (Destination)</h4>
                                <p className="font-semibold text-lg">{transfer.destinationLocation.name}</p>
                                <p className="text-sm text-gray-500">{transfer.destinationLocation.address || 'No address'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-gray-500">Logistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Driver</span>
                                <span className="font-medium">{transfer.driverName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Vehicle</span>
                                <span className="font-medium">{transfer.vehicleNumber || 'N/A'}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium">{format(new Date(transfer.createdAt), 'MMM dd, HH:mm')}</span>
                            </div>
                            {transfer.sentAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Sent</span>
                                    <span className="font-medium">{format(new Date(transfer.sentAt), 'MMM dd, HH:mm')}</span>
                                </div>
                            )}
                            {transfer.receivedAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Received</span>
                                    <span className="font-medium text-green-600">{format(new Date(transfer.receivedAt), 'MMM dd, HH:mm')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
