'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { queueOperation } from '@/lib/db/ops'
import { ItemDialog } from '@/components/inventory/ItemDialog'
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog'
import { StockHistory } from '@/components/inventory/StockHistory'
import { LocalStockMovement } from '@/lib/db/types'

export default function ItemDetailPage() {
    const params = useParams()
    const router = useRouter()
    const itemId = params.id as string
    const { user, getToken } = useAuth()

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Sync Item and Movements on mount
    useEffect(() => {
        const syncItemData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL
                const token = await getToken()

                if (!token) return

                // 1. Fetch Item Details
                const itemRes = await fetch(`${apiUrl}/items/${itemId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (itemRes.ok) {
                    const itemData = await itemRes.json()
                    await db.items.put({ ...itemData, syncedAt: Date.now() })
                }

                // 2. Fetch Stock Movements
                const movementsRes = await fetch(`${apiUrl}/stock-movements?itemId=${itemId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (movementsRes.ok) {
                    const movements = await movementsRes.json()
                    await db.stockMovements.bulkPut(movements.map((m: any) => ({
                        ...m,
                        syncedAt: Date.now()
                    })))
                }

            } catch (error) {
                console.error('Failed to sync item data:', error)
            }
        }

        syncItemData()
    }, [itemId, user])

    // Live Queries
    const item = useLiveQuery(
        () => db.items.get(itemId),
        [itemId]
    )

    const category = useLiveQuery(
        () => item?.categoryId ? db.categories.get(item.categoryId) : undefined,
        [item?.categoryId]
    )

    const movements = useLiveQuery(
        () => db.stockMovements
            .where('itemId')
            .equals(itemId)
            .reverse()
            .sortBy('createdAt'),
        [itemId]
    ) as LocalStockMovement[] | undefined

    // Calculate Stock Level
    const currentStock = useMemo(() => {
        if (!movements) return 0
        return movements.reduce((total, m) => total + m.quantity, 0)
    }, [movements])

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await queueOperation('items', 'DELETE', { id: itemId }, itemId)
            router.push('/dashboard/inventory')
        } catch (error) {
            console.error('Failed to delete item:', error)
            setIsDeleting(false)
        }
    }

    if (!item) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading item...</p>
            </div>
        )
    }

    const isLowStock = item.reorderPoint !== undefined && currentStock <= (item.reorderPoint || 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/inventory">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {item.name}
                            {isLowStock && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Low Stock
                                </span>
                            )}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{item.sku}</span>
                            {category && (
                                <>
                                    <span>•</span>
                                    <span>{category.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Item
                    </Button>
                    <StockAdjustmentDialog item={item} />
                    <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Current Stock</div>
                            <div className={`mt-2 text-3xl font-semibold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                {currentStock} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Selling Price</div>
                            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                                {Number(item.sellingPrice).toLocaleString()}
                                <span className="text-sm font-normal text-gray-500 ml-1">TZS</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Stock Value</div>
                            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                                {(currentStock * Number(item.sellingPrice)).toLocaleString()}
                                <span className="text-sm font-normal text-gray-500 ml-1">TZS</span>
                            </div>
                        </div>
                    </div>

                    {/* Stock History */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Stock Movement History</h3>
                        </div>
                        <div className="p-6">
                            <StockHistory movements={movements || []} />
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Item Details</h3>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.description || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">{item.barcode || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost Price</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{Number(item.costPrice).toLocaleString()} TZS</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reorder Point</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.reorderPoint || 0} {item.unit}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reorder Quantity</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.reorderQuantity || 0} {item.unit}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <ItemDialog
                mode="edit"
                itemId={itemId}
                itemData={item}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Item"
                description="Are you sure you want to delete this item? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete Item"}
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    )
}
