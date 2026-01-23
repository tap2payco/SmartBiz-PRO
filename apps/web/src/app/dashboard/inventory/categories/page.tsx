'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Layers, Edit, Trash2, ArrowLeft } from 'lucide-react'
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
import { CategoryDialog } from '@/components/inventory/CategoryDialog'

export default function CategoriesPage() {
    const { user, getToken } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<any>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Offline-First: Sync on mount
    useEffect(() => {
        const syncCategories = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL
                const token = await getToken()

                if (!token) return

                const response = await fetch(`${apiUrl}/categories`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const categories = await response.json()

                    // Update local cache
                    await db.categories.bulkPut(categories.map((cat: any) => ({
                        ...cat,
                        syncedAt: Date.now()
                    })))
                }
            } catch (error) {
                console.error('Failed to sync categories:', error)
            } finally {
                setIsLoading(false)
            }
        }

        syncCategories()
    }, [user])

    // Live Query from Local DB
    const categories = useLiveQuery(
        () => {
            let collection = db.categories.orderBy('name')

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase()
                return collection.filter(cat =>
                    cat.name.toLowerCase().includes(lowerQuery)
                ).toArray()
            }

            return collection.toArray()
        },
        [searchQuery]
    )

    const handleDelete = async (category: any) => {
        setIsDeleting(true)
        try {
            await queueOperation('categories', 'DELETE', { id: category.id }, category.id)
            setDeleteDialogOpen(false)
            setCategoryToDelete(null)
        } catch (error) {
            console.error('Failed to delete category:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/inventory">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage item categories</p>
                    </div>
                </div>
                <CategoryDialog mode="create" />
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading categories...</p>
                    </div>
                ) : !categories || categories.length === 0 ? (
                    <div className="p-12 text-center">
                        <Layers className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories yet</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Create categories to organize your inventory.
                        </p>
                        <div className="mt-6">
                            <CategoryDialog mode="create" />
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                    <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {category.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                                                {category.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCategory(category)
                                                        setEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        setCategoryToDelete(category)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Category Dialog */}
            {selectedCategory && (
                <CategoryDialog
                    mode="edit"
                    categoryId={selectedCategory.id}
                    categoryData={selectedCategory}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open)
                        if (!open) setSelectedCategory(null)
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Category"
                description={`Are you sure you want to delete ${categoryToDelete?.name}? Items in this category will need to be reassigned.`}
                confirmText={isDeleting ? 'Deleting...' : 'Delete'}
                onConfirm={() => categoryToDelete && handleDelete(categoryToDelete)}
                variant="destructive"
            />
        </div>
    )
}
