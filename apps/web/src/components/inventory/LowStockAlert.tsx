'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, Package, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface LowStockItem {
    id: string
    name: string
    sku: string
    reorderPoint: number
    currentStock: number
}

interface LowStockAlertProps {
    className?: string
}

export function LowStockAlert({ className = '' }: LowStockAlertProps) {
    const { getToken } = useAuth()
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        const fetchLowStock = async () => {
            try {
                const token = await getToken()
                if (!token) return

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/low-stock`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (res.ok) {
                    const data = await res.json()
                    setLowStockItems(data.items || [])
                }
            } catch (error) {
                console.error('Failed to fetch low stock items:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLowStock()
    }, [getToken])

    if (isLoading || isDismissed || lowStockItems.length === 0) {
        return null
    }

    return (
        <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-800/50 rounded-lg p-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                            Low Stock Alert
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} below reorder point
                        </p>
                        <div className="mt-3 space-y-2">
                            {lowStockItems.slice(0, 3).map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <Package className="h-3 w-3 text-amber-600" />
                                    <span className="text-amber-800 dark:text-amber-200 font-medium">{item.name}</span>
                                    <span className="text-amber-600 dark:text-amber-400">({item.sku})</span>
                                </div>
                            ))}
                            {lowStockItems.length > 3 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    +{lowStockItems.length - 3} more items
                                </p>
                            )}
                        </div>
                        <Link
                            href="/dashboard/inventory?filter=low-stock"
                            className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                        >
                            View all low stock items
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
