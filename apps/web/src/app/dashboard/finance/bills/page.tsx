'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, FileText, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { CreateBillDialog } from '@/components/finance/CreateBillDialog'
import { RecordPaymentDialog } from '@/components/finance/RecordPaymentDialog'

interface Bill {
    id: string
    invoiceNumber: string
    invoiceDate: string
    dueDate: string | null
    status: string
    subtotal: string
    taxTotal: string
    totalAmount: string
    paidAmount: string
    supplier: {
        id: string
        name: string
    }
    purchaseOrder?: {
        orderNumber: string
    }
}

export default function BillsPage() {
    const [bills, setBills] = useState<Bill[]>([])
    const [loading, setLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
    const { getToken } = useAuth()
    const router = useRouter()

    const fetchBills = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/bills`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setBills(data)
            }
        } catch (error) {
            console.error('Failed to fetch bills:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBills()
    }, [])

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0
        }).format(parseFloat(amount))
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>
            case 'PARTIAL_PAID':
                return <Badge className="bg-blue-500"><DollarSign className="w-3 h-3 mr-1" /> Partial</Badge>
            case 'PENDING':
                return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            case 'OVERDUE':
                return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getOutstandingAmount = (bill: Bill) => {
        return parseFloat(bill.totalAmount) - parseFloat(bill.paidAmount)
    }

    const handleRecordPayment = (bill: Bill) => {
        setSelectedBill(bill)
        setPaymentDialogOpen(true)
    }

    // Calculate summary stats
    const totalOutstanding = bills.reduce((sum, bill) => sum + getOutstandingAmount(bill), 0)
    const pendingCount = bills.filter(b => b.status === 'PENDING' || b.status === 'PARTIAL_PAID').length
    const overdueCount = bills.filter(b => b.status === 'OVERDUE').length

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/finance')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Supplier Bills</h1>
                        <p className="text-muted-foreground">Manage your payables and record payments</p>
                    </div>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create Bill
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding.toString())}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Bills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Bills Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>PO #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Outstanding</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : bills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">
                                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No bills yet</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bills.map((bill) => (
                                    <TableRow key={bill.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/finance/bills/${bill.id}`)}>
                                        <TableCell className="font-medium text-blue-600 hover:underline">{bill.invoiceNumber}</TableCell>
                                        <TableCell>{bill.supplier?.name}</TableCell>
                                        <TableCell>{bill.purchaseOrder?.orderNumber || '-'}</TableCell>
                                        <TableCell>{new Date(bill.invoiceDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(bill.totalAmount)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(bill.paidAmount)}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(getOutstandingAmount(bill).toString())}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            {bill.status !== 'PAID' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRecordPayment(bill)}
                                                >
                                                    <DollarSign className="w-3 h-3 mr-1" /> Pay
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateBillDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchBills}
            />

            {selectedBill && (
                <RecordPaymentDialog
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                    bill={selectedBill}
                    onSuccess={fetchBills}
                />
            )}
        </div>
    )
}
