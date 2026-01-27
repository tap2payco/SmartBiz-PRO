'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowLeftRight, Wallet, Building2, Smartphone, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { AddAccountDialog } from '@/components/finance/AddAccountDialog'
import { TransferDialog } from '@/components/finance/TransferDialog'
import { formatCurrency } from '@/lib/utils'

interface Account {
    id: string
    name: string
    type: 'CASH' | 'BANK' | 'MOBILE_MONEY'
    accountNumber?: string
    bankName?: string
    currency: string
    currentBalance: string
    isActive: boolean
}

export default function CashManagementPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [addAccountOpen, setAddAccountOpen] = useState(false)
    const [transferOpen, setTransferOpen] = useState(false)

    const fetchAccounts = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAccounts()
    }, [])

    const getIcon = (type: string) => {
        switch (type) {
            case 'BANK': return <Building2 className="w-5 h-5" />
            case 'MOBILE_MONEY': return <Smartphone className="w-5 h-5" />
            default: return <Wallet className="w-5 h-5" />
        }
    }

    const getTotalBalance = () => {
        return accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/finance')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Cash Management</h1>
                        <p className="text-muted-foreground">Manage accounts, balances, and transfers</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={accounts.length < 2}>
                        <ArrowLeftRight className="w-4 h-4 mr-2" /> Transfer
                    </Button>
                    <Button onClick={() => setAddAccountOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Account
                    </Button>
                </div>
            </div>

            {/* Total Balance Card */}
            <Card className="bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium opacity-90">Total Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{formatCurrency(getTotalBalance())}</div>
                    <p className="text-sm opacity-80 mt-1">Across {accounts.length} active accounts</p>
                </CardContent>
            </Card>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Accounts Found</h3>
                        <p className="text-muted-foreground mb-4">Add your first cash drawer or bank account to get started.</p>
                        <Button onClick={() => setAddAccountOpen(true)}>Add Account</Button>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <Card
                            key={account.id}
                            className="cursor-pointer hover:border-primary transition-colors group"
                            onClick={() => router.push(`/dashboard/finance/cash/${account.id}`)}
                        >
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                                        {getIcon(account.type)}
                                    </div>
                                    {account.name}
                                </CardTitle>
                                {account.type === 'BANK' && <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{account.bankName}</span>}
                                {account.type === 'MOBILE_MONEY' && <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{account.bankName}</span>}
                            </CardHeader>
                            <CardContent>
                                {account.accountNumber && (
                                    <p className="text-xs text-muted-foreground mb-4 font-mono">
                                        {account.accountNumber}
                                    </p>
                                )}
                                <div className="text-2xl font-bold">
                                    {formatCurrency(parseFloat(account.currentBalance))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Click to view history
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <AddAccountDialog
                open={addAccountOpen}
                onOpenChange={setAddAccountOpen}
                onSuccess={fetchAccounts}
            />

            <TransferDialog
                open={transferOpen}
                onOpenChange={setTransferOpen}
                accounts={accounts}
                onSuccess={fetchAccounts}
            />
        </div>
    )
}
