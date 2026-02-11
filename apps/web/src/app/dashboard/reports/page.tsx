'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    ShoppingCart,
    Calendar,
    Download,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area
} from 'recharts'
import { toast } from 'sonner'

interface PnLData {
    period: { start: string; end: string }
    revenue: number
    cogs: number
    grossProfit: number
    expenses: number
    netProfit: number
    margin: number
}

interface ChartDataPoint {
    date: string
    dateShort: string
    revenue: number
}

interface TopProduct {
    itemId: string
    name: string
    totalQuantity: number
    totalRevenue: number
}

interface InventoryItem {
    id: string
    name: string
    sku: string
    costPrice: number
    sellingPrice: number
    stockLevel: number
    reorderPoint: number
    stockValue: number
}

export default function ReportsPage() {
    const { getToken } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    // P&L State
    const [pnl, setPnl] = useState<PnLData | null>(null)
    const [pnlPeriod, setPnlPeriod] = useState('this_month')

    // Chart State
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [chartRange, setChartRange] = useState('30d')

    // Top Products
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])

    // Inventory Valuation
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [inventoryStats, setInventoryStats] = useState({ totalValue: 0, totalItems: 0, lowStockCount: 0 })

    // Dashboard stats
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, todayRevenue: 0 })

    const getDateRange = (period: string) => {
        const end = new Date()
        const start = new Date()
        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0)
                break
            case 'this_week':
                start.setDate(start.getDate() - start.getDay())
                start.setHours(0, 0, 0, 0)
                break
            case 'this_month':
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                break
            case 'this_quarter':
                start.setMonth(start.getMonth() - (start.getMonth() % 3), 1)
                start.setHours(0, 0, 0, 0)
                break
            case 'this_year':
                start.setMonth(0, 1)
                start.setHours(0, 0, 0, 0)
                break
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() }
    }

    const fetchAllReports = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }
            const api = process.env.NEXT_PUBLIC_API_URL

            const { startDate, endDate } = getDateRange(pnlPeriod)

            // Parallel fetch all endpoints
            const [pnlRes, chartRes, productsRes, dashRes, invRes] = await Promise.all([
                fetch(`${api}/reports/pnl?startDate=${startDate}&endDate=${endDate}`, { headers }),
                fetch(`${api}/reports/sales-chart?range=${chartRange}`, { headers }),
                fetch(`${api}/reports/top-products?limit=10`, { headers }),
                fetch(`${api}/reports/dashboard`, { headers }),
                fetch(`${api}/reports/inventory-valuation`, { headers }),
            ])

            if (pnlRes.ok) setPnl(await pnlRes.json())
            if (chartRes.ok) {
                const raw = await chartRes.json()
                setChartData(raw.map((d: any) => ({
                    ...d,
                    dateShort: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                })))
            }
            if (productsRes.ok) setTopProducts(await productsRes.json())
            if (dashRes.ok) setStats(await dashRes.json())
            if (invRes.ok) {
                const data = await invRes.json()
                setInventory(data.items || [])
                setInventoryStats(data.summary || { totalValue: 0, totalItems: 0, lowStockCount: 0 })
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error)
            toast.error('Failed to load reports')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchAllReports() }, [pnlPeriod, chartRange])

    const handleExportCSV = (reportName: string, data: any[]) => {
        if (!data.length) return toast.error('No data to export')
        const headers = Object.keys(data[0])
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportName}_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`${reportName} exported`)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const maxProductRevenue = Math.max(...topProducts.map(p => p.totalRevenue), 1)

    return (
        <div className="space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        Reports & Analytics
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Business performance insights and financial summaries.
                    </p>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Sales</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.todayRevenue)}</p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders.toLocaleString()}</p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <ShoppingCart className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Value</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(inventoryStats.totalValue)}</p>
                            </div>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Package className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Profit & Loss Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Profit & Loss Statement
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={pnlPeriod} onValueChange={setPnlPeriod}>
                            <SelectTrigger className="w-[160px] h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="this_quarter">This Quarter</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm"
                            onClick={() => pnl && handleExportCSV('pnl_report', [{
                                Revenue: pnl.revenue, COGS: pnl.cogs, GrossProfit: pnl.grossProfit,
                                Expenses: pnl.expenses, NetProfit: pnl.netProfit, Margin: `${pnl.margin.toFixed(1)}%`
                            }])}>
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {pnl ? (
                        <div className="space-y-4">
                            {/* P&L Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Revenue */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                                        <span className="text-lg font-bold text-green-600">{formatCurrency(pnl.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 text-sm border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-gray-500">Cost of Goods Sold</span>
                                        <span className="text-red-500">- {formatCurrency(pnl.cogs)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gross Profit</span>
                                        <span className={`text-lg font-bold ${pnl.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(pnl.grossProfit)}
                                        </span>
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Operating Expenses</span>
                                        <span className="text-lg font-bold text-red-500">- {formatCurrency(pnl.expenses)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Profit</span>
                                        <span className={`text-xl font-bold ${pnl.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(pnl.netProfit)}
                                        </span>
                                    </div>
                                </div>

                                {/* Margin Indicator */}
                                <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Net Margin</p>
                                    <div className={`text-4xl font-bold ${pnl.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {pnl.margin.toFixed(1)}%
                                    </div>
                                    <div className="flex items-center gap-1 mt-2">
                                        {pnl.margin > 0 ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
                                                <ArrowUpRight className="h-3 w-3" /> Profitable
                                            </Badge>
                                        ) : pnl.margin === 0 ? (
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 gap-1">
                                                <Minus className="h-3 w-3" /> Break Even
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-red-100 text-red-700 gap-1">
                                                <ArrowDownRight className="h-3 w-3" /> Loss
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">No data available for this period.</div>
                    )}
                </CardContent>
            </Card>

            {/* Sales Chart + Top Products Row */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Sales Trend Chart */}
                <Card className="lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={chartRange} onValueChange={setChartRange}>
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="90d">Last 3 Months</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm"
                                onClick={() => handleExportCSV('sales_data', chartData.map(d => ({ Date: d.date, Revenue: d.revenue })))}>
                                <Download className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full mt-2">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis
                                            dataKey="dateShort"
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                                            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fill="url(#revenueGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                    No sales data in this period
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Top Selling Products</CardTitle>
                        <Button variant="outline" size="sm"
                            onClick={() => handleExportCSV('top_products', topProducts.map(p => ({ Product: p.name, Quantity: p.totalQuantity, Revenue: p.totalRevenue })))}>
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProducts.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-400">No sales data available.</div>
                            ) : (
                                topProducts.map((product, index) => (
                                    <div key={product.itemId} className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                                            ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-blue-400'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium truncate max-w-[140px]">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.totalQuantity} sold</p>
                                            </div>
                                            <div className="mt-1.5 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                                                    style={{ width: `${(product.totalRevenue / maxProductRevenue) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5 text-right">{formatCurrency(product.totalRevenue)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Valuation Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-amber-600" />
                        Inventory Valuation
                    </CardTitle>
                    <Button variant="outline" size="sm"
                        onClick={() => handleExportCSV('inventory_valuation', inventory.map(i => ({
                            Name: i.name, SKU: i.sku, CostPrice: i.costPrice, SellingPrice: i.sellingPrice,
                            StockLevel: i.stockLevel, StockValue: i.stockValue
                        })))}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 text-center">
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase">Total Stock Value</p>
                            <p className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">{formatCurrency(inventoryStats.totalValue)}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 text-center">
                            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium uppercase">Total Products</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">{inventoryStats.totalItems}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 text-center">
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium uppercase">Low Stock Items</p>
                            <p className="text-2xl font-bold text-red-800 dark:text-red-200 mt-1">{inventoryStats.lowStockCount}</p>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sell Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {inventory.slice(0, 20).map((item) => {
                                    const isLow = item.reorderPoint > 0 && item.stockLevel <= item.reorderPoint
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.costPrice)}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.sellingPrice)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={isLow ? 'text-red-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
                                                    {item.stockLevel}
                                                </span>
                                                {isLow && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">LOW</Badge>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.stockValue)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {inventory.length > 20 && (
                            <div className="text-center py-3 text-xs text-gray-400 border-t">
                                Showing top 20 of {inventory.length} items. Export CSV for full report.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
