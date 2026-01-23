'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, SlidersHorizontal } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'
import { AdjustmentDialog } from '@/components/finance/AdjustmentDialog'

interface Transaction {
    id: string
    type: 'DEPOSIT' | 'WITHDRAWAL'
    amount: string
    transactionDate: string
    description: string | null
    referenceType: string
    createdAt: string
}

interface Account {
    id: string
    name: string
    type: string
    currency: string
    currentBalance: string
    accountNumber?: string
    bankName?: string
}

export default function AccountDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const accountId = params.id as string

    const [account, setAccount] = useState<Account | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)

    const fetchData = async () => {
        try {
            const token = await getToken()
            // Fetch ALL accounts to find this one (since we don't have a single GET endpoint yet, 
            // but we can optimize later. Alternatively, filter the list).
            // Actually, let's just fetch list and find. 
            // Ideally we should have GET /banking/accounts/:id but for now this works.

            const [accountsRes, txRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts/${accountId}/transactions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ])

            if (accountsRes.ok) {
                const accountsData = await accountsRes.json()
                const found = accountsData.find((a: any) => a.id === accountId)
                if (found) setAccount(found)
                else router.push('/dashboard/finance/cash')
            }

            if (txRes.ok) {
                const txData = await txRes.json()
                setTransactions(txData)
            }

        } catch (error) {
            console.error('Failed to load account data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (accountId) fetchData()
    }, [accountId])

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    if (!account) return null

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{account.name}</h1>
                        <p className="text-muted-foreground">
                            {account.bankName ? `${account.bankName} • ` : ''}
                            {account.accountNumber || account.type}
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setAdjustDialogOpen(true)}>
                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Manual Adjustment
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary text-primary-foreground md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(account.currentBalance)}</div>
                        <p className="text-sm opacity-80 mt-1">{account.currency}</p>
                    </CardContent>
                </Card>
                {/* Could add Inflow/Outflow stats here if we calculated them */}
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.type === 'DEPOSIT' ? 'default' : 'secondary'} className={tx.type === 'DEPOSIT' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{tx.referenceType}</TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AdjustmentDialog
                open={adjustDialogOpen}
                onOpenChange={setAdjustDialogOpen}
                account={account}
                onSuccess={fetchData}
            />
        </div>
    )
}
