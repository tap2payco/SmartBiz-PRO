'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp } from 'lucide-react'

interface TopItem {
    itemId: string
    name: string
    totalQuantity: number
    totalRevenue: number
}

export function TopProducts() {
    const { getToken, user } = useAuth()
    const [items, setItems] = useState<TopItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const token = await getToken()
                if (!token) return

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/top-products?limit=5`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (res.ok) {
                    const data = await res.json()
                    setItems(data)
                }
            } catch (error) {
                console.error('Failed to fetch top products:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (user) fetchTopProducts()
    }, [user, getToken])

    // Find max revenue for progress bar calculation
    const maxRevenue = Math.max(...items.map(i => i.totalRevenue), 0)

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse" />
                                        <div className="h-3 w-[150px] bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                            No sales data available.
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.itemId} className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium leading-none truncate max-w-[150px]">{item.name}</p>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {item.totalQuantity} sold
                                        </div>
                                    </div>
                                    {/* Progress bar relative to max revenue or quantity */}
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(item.totalRevenue / (maxRevenue || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right mt-1">
                                        {item.totalRevenue.toLocaleString()} Revenue
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
