'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Receipt, Trash2, TrendingDown } from 'lucide-react'
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
import { AddExpenseDialog } from '@/components/finance/AddExpenseDialog'

interface ExpenseCategory {
    id: string
    name: string
    type: string
}

interface Expense {
    id: string
    description: string
    amount: string
    expenseDate: string
    reference: string | null
    paymentMethod: string | null
    notes: string | null
    category: ExpenseCategory | null
}

interface ExpenseSummary {
    byCategory: Array<{ categoryName: string | null; total: string }>
    monthlyTotal: string
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [summary, setSummary] = useState<ExpenseSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const { getToken } = useAuth()
    const router = useRouter()

    const fetchExpenses = async () => {
        try {
            const token = await getToken()
            const [expensesRes, summaryRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ])

            if (expensesRes.ok) {
                const data = await expensesRes.json()
                setExpenses(data)
            }
            if (summaryRes.ok) {
                const data = await summaryRes.json()
                setSummary(data)
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExpenses()
    }, [])

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0
        }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                fetchExpenses()
            }
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    const getCategoryBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            'OPERATING': 'bg-blue-500',
            'ADMINISTRATIVE': 'bg-purple-500',
            'MARKETING': 'bg-pink-500',
            'PAYROLL': 'bg-green-500',
            'UTILITIES': 'bg-yellow-500',
            'RENT': 'bg-orange-500',
            'OTHER': 'bg-gray-500'
        }
        return colors[type] || 'bg-gray-500'
    }

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/finance')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Expense Tracking</h1>
                        <p className="text-muted-foreground">Track and manage your business expenses</p>
                    </div>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Expense
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5" />
                            {formatCurrency(summary?.monthlyTotal || '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total All Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{expenses.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses by Category */}
            {summary?.byCategory && summary.byCategory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Expenses by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {summary.byCategory.map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <span className="font-medium">{cat.categoryName || 'Uncategorized'}</span>
                                    <span className="text-red-600 font-bold">{formatCurrency(cat.total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Expenses Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No expenses recorded yet</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                        <TableCell>
                                            {expense.category ? (
                                                <Badge className={getCategoryBadgeColor(expense.category.type)}>
                                                    {expense.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{expense.paymentMethod || '-'}</TableCell>
                                        <TableCell>{expense.reference || '-'}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">
                                            {formatCurrency(expense.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(expense.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddExpenseDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={fetchExpenses}
            />
        </div>
    )
}
