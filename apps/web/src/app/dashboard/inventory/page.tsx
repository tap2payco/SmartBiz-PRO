'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { AlertTriangle, Plus, Search, Package, Edit, Trash2, Eye, MoreHorizontal, Layers, Filter, Printer, Camera, ArrowRightLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { queueOperation } from '@/lib/db/ops'
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog'
import { StockTransferDialog } from '@/components/inventory/StockTransferDialog'
import { Badge } from '@/components/ui/badge'
import { ItemDialog } from '@/components/inventory/ItemDialog'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { toast } from 'sonner'
import { BarcodeScannerDialog } from '@/components/shared/BarcodeScannerDialog'
import { PrintLabelsDialog } from '@/components/inventory/PrintLabelsDialog'
import { Checkbox } from '@/components/ui/checkbox'

export default function InventoryPage() {
    const { user, getToken } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'low-stock'>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
    const [transferDialogOpen, setTransferDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
    const [printLabelsDialogOpen, setPrintLabelsDialogOpen] = useState(false)

    // Sync filter from URL
    useEffect(() => {
        const filterParam = searchParams.get('filter')
        if (filterParam === 'low-stock') {
            setFilter('low-stock')
        } else {
            setFilter('all')
        }
    }, [searchParams])

    // Update URL when filter changes
    const handleFilterChange = (newFilter: 'all' | 'low-stock') => {
        setFilter(newFilter)
        const params = new URLSearchParams(searchParams)
        if (newFilter === 'low-stock') {
            params.set('filter', 'low-stock')
        } else {
            params.delete('filter')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    // Offline-First: Sync on mount
    useEffect(() => {
        const syncItems = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL
                const token = await getToken()

                if (!token) return

                const response = await fetch(`${apiUrl}/items`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const items = await response.json()

                    // Update local cache
                    await db.items.bulkPut(items.map((item: any) => ({
                        ...item,
                        syncedAt: Date.now()
                    })))
                }

                // Also sync stock movements to ensure accurate counts
                const movementsRes = await fetch(`${apiUrl}/stock-movements`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (movementsRes.ok) {
                    const movements = await movementsRes.json()
                    await db.stockMovements.bulkPut(movements)
                }

            } catch (error) {
                console.error('Failed to sync items:', error)
            } finally {
                setIsLoading(false)
            }
        }

        syncItems()
    }, [user])

    // Live Query from Local DB
    const items = useLiveQuery(
        async () => {
            let collection = db.items.orderBy('name')
            const allItems = await collection.toArray()

            // Fetch all stock movements to calculate current stock
            // Optimization: In a real app with many movements, we'd use a separate 'inventory_levels' table
            // updated via triggers/hooks, but for now we aggregate.
            const allMovements = await db.stockMovements.toArray()
            const stockMap = new Map<string, number>()

            allMovements.forEach(m => {
                const current = stockMap.get(m.itemId) || 0
                stockMap.set(m.itemId, current + m.quantity)
            })

            const itemsWithStock = allItems.map(item => ({
                ...item,
                currentStock: stockMap.get(item.id) || 0
            }))

            return itemsWithStock.filter(item => {
                // Filter by Search Query
                let matchesSearch = true
                if (searchQuery) {
                    const lowerQuery = searchQuery.toLowerCase()
                    const nameMatch = item.name.toLowerCase().includes(lowerQuery)
                    const skuMatch = item.sku ? item.sku.toLowerCase().includes(lowerQuery) : false
                    const barcodeMatch = item.barcode ? item.barcode.includes(searchQuery) : false
                    matchesSearch = nameMatch || skuMatch || barcodeMatch
                }

                // Filter by Low Stock
                let matchesFilter = true
                if (filter === 'low-stock') {
                    matchesFilter = (item.reorderPoint || 0) > 0 && (item.currentStock || 0) <= (item.reorderPoint || 0)
                }

                return matchesSearch && matchesFilter
            })
        },
        [searchQuery, filter]
    )

    const handleDelete = async (item: any) => {
        setIsDeleting(true)
        try {
            await queueOperation('items', 'DELETE', { id: item.id }, item.id)
            setDeleteDialogOpen(false)
            setItemToDelete(null)
        } catch (error) {
            console.error('Failed to delete item:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const [isScannerOpen, setIsScannerOpen] = useState(false)

    // Barcode Scanning
    useBarcodeScanner({
        onScan: (code) => {
            setSearchQuery(code)
            toast.info(`Filtered by barcode: ${code}`)
        }
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden border border-white/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Inventory</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Real-time stock intelligence & management</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {selectedItemIds.size > 0 && (
                            <Button
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                onClick={() => setPrintLabelsDialogOpen(true)}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print Labels ({selectedItemIds.size})
                            </Button>
                        )}
                        <Button variant="outline" className="rounded-2xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => { setSelectedItem(null); setTransferDialogOpen(true) }}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Transfer
                        </Button>
                        <Link href="/dashboard/inventory/categories">
                            <Button variant="outline" className="rounded-2xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <Layers className="h-4 w-4 mr-2" />
                                Categories
                            </Button>
                        </Link>
                        <ItemDialog mode="create" />
                    </div>
                </div>
            </div>

            {/* Filters & Search - Premium Row */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, SKU, or barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-2xl h-[52px] w-[52px] border-2" onClick={() => setIsScannerOpen(true)}>
                        <Camera className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <button
                        onClick={() => handleFilterChange('all')}
                        className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${filter === 'all'
                            ? 'bg-white dark:bg-gray-700 text-primary dark:text-blue-400 shadow-md ring-1 ring-black/5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        Master Inventory
                    </button>
                    <button
                        onClick={() => handleFilterChange('low-stock')}
                        className={`px-6 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${filter === 'low-stock'
                            ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-md ring-1 ring-black/5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Stock Alerts
                    </button>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading items...</p>
                    </div>
                ) : !items || items.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No items yet</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Get started by adding your first inventory item.
                        </p>
                        <div className="mt-6">
                            <ItemDialog mode="create" />
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-3 py-3 w-10">
                                        <Checkbox
                                            checked={items && items.length > 0 && selectedItemIds.size === items.length}
                                            onCheckedChange={(checked) => {
                                                if (checked && items) {
                                                    setSelectedItemIds(new Set(items.map(i => i.id)))
                                                } else {
                                                    setSelectedItemIds(new Set())
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Item
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-3 py-4">
                                            <Checkbox
                                                checked={selectedItemIds.has(item.id)}
                                                onCheckedChange={(checked) => {
                                                    const newSet = new Set(selectedItemIds)
                                                    if (checked) {
                                                        newSet.add(item.id)
                                                    } else {
                                                        newSet.delete(item.id)
                                                    }
                                                    setSelectedItemIds(newSet)
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.name}
                                                    </div>
                                                    {item.barcode && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 dark:text-white font-mono">
                                                {item.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {item.categoryId || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                TZS {Number(item.sellingPrice).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${(item.currentStock || 0) <= (item.reorderPoint || 0) ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {item.currentStock || 0} {item.unit}
                                                </span>
                                                {(item.reorderPoint || 0) > 0 && (item.currentStock || 0) <= (item.reorderPoint || 0) && (
                                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                                        Low Stock
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/inventory/${item.id}`} className="cursor-pointer">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedItem(item)
                                                            setAdjustmentDialogOpen(true)
                                                        }}
                                                    >
                                                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                                                        Adjust Stock
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedItem(item)
                                                            setTransferDialogOpen(true)
                                                        }}
                                                    >
                                                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                                                        Transfer
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedItem(item)
                                                            setEditDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setItemToDelete(item)
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Item Dialog */}
            {selectedItem && (
                <ItemDialog
                    mode="edit"
                    itemId={selectedItem.id}
                    itemData={selectedItem}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open)
                        if (!open) setSelectedItem(null)
                    }}
                />
            )}

            {/* Stock Adjustment Dialog */}
            {selectedItem && (
                <StockAdjustmentDialog
                    item={selectedItem}
                    open={adjustmentDialogOpen}
                    onOpenChange={(open) => {
                        setAdjustmentDialogOpen(open)
                        if (!open) setSelectedItem(null)
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Item"
                description={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone.`}
                confirmText={isDeleting ? 'Deleting...' : 'Delete'}
                onConfirm={() => itemToDelete && handleDelete(itemToDelete)}
                variant="destructive"
            />

            <StockTransferDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                onSuccess={() => router.refresh()}
                preselectedItemId={selectedItem?.id}
            />

            <PrintLabelsDialog
                open={printLabelsDialogOpen}
                onOpenChange={setPrintLabelsDialogOpen}
                items={items?.filter(i => selectedItemIds.has(i.id)) || []}
            />

            <BarcodeScannerDialog
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScan={(code) => {
                    setSearchQuery(code)
                    toast.info(`Filtered by barcode: ${code}`)
                }}
            />
        </div>
    )
}
