'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface PnLData {
    period: { start: string, end: string }
    revenue: number
    cogs: number
    grossProfit: number
    expenses: number
    netProfit: number
    margin: number
}

export default function FinancialReportsPage() {
    const router = useRouter()
    const { getToken, checkPermission } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<PnLData | null>(null)
    const [period, setPeriod] = useState('this_month')

    useEffect(() => {
        if (!checkPermission('REPORTS_FINANCIAL')) {
            router.push('/dashboard')
            return
        }
        fetchReport()
    }, [period])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const token = await getToken()

            // Calculate dates based on period
            const now = new Date()
            let start = new Date()
            let end = new Date()

            if (period === 'this_month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1)
            } else if (period === 'last_month') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                end = new Date(now.getFullYear(), now.getMonth(), 0)
            } else if (period === 'this_year') {
                start = new Date(now.getFullYear(), 0, 1)
            }

            const query = new URLSearchParams({
                startDate: start.toISOString(),
                endDate: end.toISOString()
            })

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/pnl?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const reportData = await res.json()
                setData(reportData)
            }
        } catch (error) {
            console.error('Failed to fetch P&L:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!data && loading) return <div className="p-8">Loading Report...</div>

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Financial Reports</h1>
                        <p className="text-muted-foreground">Profit & Loss Statement</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                </div>
            </div>

            {data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.revenue)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Gross Sales</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Cost of Goods Sold</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{formatCurrency(data.cogs)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Product Costs</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(data.expenses)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Operational Costs</p>
                            </CardContent>
                        </Card>
                        <Card className={data.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                                    {formatCurrency(data.netProfit)}
                                </div>
                                <p className="text-xs opacity-70 mt-1">Net Margin: {data.margin.toFixed(1)}%</p>
                            </CardContent>
                        </Card>
                    </div>



                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Financial Overview</CardTitle>
                                <CardDescription>Visual breakdown of income and costs</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Revenue', value: data.revenue, color: '#16a34a' },
                                            { name: 'COGS', value: data.cogs, color: '#ea580c' },
                                            { name: 'Expenses', value: data.expenses, color: '#dc2626' },
                                            { name: 'Net Profit', value: data.netProfit, color: data.netProfit >= 0 ? '#15803d' : '#991b1b' },
                                        ]}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value) || 0)}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="value" name="Amount (TZS)">
                                            {
                                                [
                                                    { name: 'Revenue', value: data.revenue, color: '#16a34a' },
                                                    { name: 'COGS', value: data.cogs, color: '#ea580c' },
                                                    { name: 'Expenses', value: data.expenses, color: '#dc2626' },
                                                    { name: 'Net Profit', value: data.netProfit, color: data.netProfit >= 0 ? '#15803d' : '#991b1b' },
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gross Profit Analysis</CardTitle>
                                <CardDescription>Revenue minus Direct Costs (COGS)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                        <span className="font-medium">Total Sales</span>
                                        <span>{formatCurrency(data.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                        <span className="font-medium">Cost of Goods</span>
                                        <span className="text-red-500">({formatCurrency(data.cogs)})</span>
                                    </div>
                                    <div className="h-px bg-border" />
                                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                                        <span className="font-bold">Gross Profit</span>
                                        <span className="font-bold">{formatCurrency(data.grossProfit)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Net Income Analysis</CardTitle>
                                <CardDescription>Gross Profit minus Operating Expenses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                        <span className="font-medium">Gross Profit</span>
                                        <span>{formatCurrency(data.grossProfit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                        <span className="font-medium">Operating Expenses</span>
                                        <span className="text-red-500">({formatCurrency(data.expenses)})</span>
                                    </div>
                                    <div className="h-px bg-border" />
                                    <div className={`flex justify-between items-center p-3 rounded-lg ${data.netProfit >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                                        <span className="font-bold">Net Profit / (Loss)</span>
                                        <span className={`font-bold ${data.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                                            {formatCurrency(data.netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )
            }
        </div >
    )
}
