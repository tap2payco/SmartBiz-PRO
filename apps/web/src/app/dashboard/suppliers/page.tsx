'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Plus, Search, Building2, User, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import NewSupplierDialog from '@/components/suppliers/NewSupplierDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'

export default function SuppliersPage() {
    const { user, getToken } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<any>(null)
    const [deletingSupplier, setDeletingSupplier] = useState<any>(null)

    // Real-time suppliers from IndexedDB
    const allSuppliers = useLiveQuery(
        () => db.suppliers.toArray(),
        []
    )

    // Sync suppliers from API
    useEffect(() => {
        const syncSuppliers = async () => {
            if (!user) return

            try {
                const token = await getToken()
                if (!token) return

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders?type=SUPPLIER`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (res.ok) {
                    const data = await res.json()
                    const suppliers = data.stakeholders || data

                    // Store in IndexedDB
                    await db.suppliers.bulkPut(suppliers)
                }
            } catch (error) {
                console.error('Error syncing suppliers:', error)
            }
        }

        syncSuppliers()
    }, [user, getToken])

    // Filter suppliers based on search
    const filteredSuppliers = allSuppliers?.filter(supplier => {
        const query = searchQuery.toLowerCase()
        return (
            supplier.name?.toLowerCase().includes(query) ||
            supplier.email?.toLowerCase().includes(query) ||
            supplier.phone?.toLowerCase().includes(query) ||
            supplier.city?.toLowerCase().includes(query)
        )
    }) || []

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier)
        setIsDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingSupplier) return

        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stakeholders/${deletingSupplier.id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            )

            if (res.ok) {
                await db.suppliers.delete(deletingSupplier.id)
                toast.success('Supplier deleted successfully')
            } else {
                toast.error('Failed to delete supplier')
            }
        } catch (error) {
            console.error('Error deleting supplier:', error)
            toast.error('Failed to delete supplier')
        } finally {
            setDeletingSupplier(null)
        }
    }

    const handleDialogClose = () => {
        setIsDialogOpen(false)
        setEditingSupplier(null)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Suppliers
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your suppliers and vendors
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {searchQuery ? 'No suppliers found' : 'No suppliers yet. Add your first supplier!'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {supplier.stakeholderType === 'BUSINESS' ? (
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <User className="h-4 w-4 text-gray-400" />
                                            )}
                                            {supplier.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={supplier.stakeholderType === 'BUSINESS' ? 'default' : 'secondary'}>
                                            {supplier.stakeholderType || 'Individual'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{supplier.phone || '-'}</TableCell>
                                    <TableCell>{supplier.email || '-'}</TableCell>
                                    <TableCell>{supplier.city || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingSupplier(supplier)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <NewSupplierDialog
                open={isDialogOpen}
                onOpenChange={handleDialogClose}
                supplier={editingSupplier}
            />

            <ConfirmDialog
                open={!!deletingSupplier}
                onOpenChange={(open) => !open && setDeletingSupplier(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                description={`Are you sure you want to delete ${deletingSupplier?.name}? This action cannot be undone.`}
            />
        </div>
    )
}
