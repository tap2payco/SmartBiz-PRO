'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function AnalyticsDashboard() {
    const { getToken } = useAuth()
    const [salesData, setSalesData] = useState<any[]>([])
    const [inventoryData, setInventoryData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            const [salesRes, invRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/analytics/sales-trends?period=${period}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/analytics/inventory-performance`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ])

            if (salesRes.ok) {
                const data = await salesRes.json()
                setSalesData(data.data || [])
            }
            if (invRes.ok) {
                const data = await invRes.json()
                setInventoryData(data.data || [])
            }
        } catch (error) {
            toast.error('Failed to load analytics data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [period, getToken])

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trends Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Sales Performance
                        </CardTitle>
                        <Tabs value={period} onValueChange={setPeriod} className="w-auto">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="week">Week</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                        tickFormatter={(val) => `K${(val / 1000).toFixed(0)}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Insights Widget */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-600" />
                            Inventory Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {inventoryData.slice(0, 5).map((item, idx) => (
                            <div key={item.itemId} className="flex items-center justify-between group">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                                            Turnover: {item.turnoverRate}x
                                        </Badge>
                                        {item.status === 'STAGNANT' && (
                                            <span className="flex items-center text-[10px] text-red-500 font-medium">
                                                <AlertTriangle className="h-2 w-2 mr-1" /> Stagnant
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-xs font-bold text-gray-900">{item.currentStock} in stock</p>
                                    <p className="text-[10px] text-gray-400">{item.daysSinceLastMove}d since move</p>
                                </div>
                            </div>
                        ))}
                        {inventoryData.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm italic">
                                No stock movement data.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Volume Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Order Volume by Period</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#F9FAFB' }} />
                                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                    {salesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
