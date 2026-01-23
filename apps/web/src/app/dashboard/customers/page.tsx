'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import Link from 'next/link'
import { CustomerDialog } from '@/components/customers/CustomerDialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { queueOperation } from '@/lib/db/ops'

export default function CustomersPage() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [customerToDelete, setCustomerToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Offline-First: Sync on mount
    useEffect(() => {
        const syncCustomers = async () => {
            if (!user) return
            setIsLoading(true)
            try {
                const token = (await import('@/lib/supabase/client')).createClient().auth.getSession().then(s => s.data.session?.access_token);
                const resolvedToken = await token;

                // Fetch from API
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders?type=CUSTOMER`, {
                    headers: { 'Authorization': `Bearer ${resolvedToken}` }
                })

                if (res.ok) {
                    const data = await res.json()
                    const customers = data.stakeholders

                    // Update Local DB
                    if (customers.length > 0) {
                        await db.transaction('rw', db.customers, async () => {
                            await db.customers.bulkPut(customers)
                        })
                    }
                }
            } catch (error) {
                console.error("Sync failed, utilizing local cache", error)
            } finally {
                setIsLoading(false)
            }
        }

        syncCustomers()
    }, [user])

    // Live Query from Local DB
    const customers = useLiveQuery(
        () => {
            let collection = db.customers.orderBy('name')

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase()
                return collection.filter(c =>
                    c.name.toLowerCase().includes(lowerQuery) ||
                    (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
                    (c.phone && c.phone.includes(searchQuery))
                ).toArray()
            }

            return collection.toArray()
        },
        [searchQuery]
    )

    const handleDelete = async (customer: any) => {
        setIsDeleting(true)
        try {
            await queueOperation('customers', 'DELETE', { id: customer.id }, customer.id)
            setDeleteDialogOpen(false)
            setCustomerToDelete(null)
        } catch (error) {
            console.error('Failed to delete customer:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your customer relationships</p>
                </div>
                <CustomerDialog mode="create" />
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {!customers ? (
                    <div className="p-8 text-center text-gray-500">Loading customers...</div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <UsersIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No customers yet</h3>
                        <p className="max-w-sm mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Get started by adding your first customer to track sales and balances.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/dashboard/customers/new"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Customer
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                        Contact Info
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                                        Location
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Balance
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {customer.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {customer.email ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs italic">No email</span>}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {customer.phone ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs italic">No phone</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                            {customer.city ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.city}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className="text-gray-900 dark:text-white">TZS 0.00</span>
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
                                                        <Link href={`/dashboard/customers/${customer.id}`} className="cursor-pointer">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedCustomer(customer)
                                                            setEditDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setCustomerToDelete(customer)
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

            {/* Edit Customer Dialog */}
            {selectedCustomer && (
                <CustomerDialog
                    mode="edit"
                    customerId={selectedCustomer.id}
                    customerData={selectedCustomer}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open)
                        if (!open) setSelectedCustomer(null)
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Customer"
                description={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.`}
                confirmText={isDeleting ? 'Deleting...' : 'Delete'}
                onConfirm={() => customerToDelete && handleDelete(customerToDelete)}
                variant="destructive"
            />
        </div>
    )
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )
}
