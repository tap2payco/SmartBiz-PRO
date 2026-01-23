'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CustomerDialog } from '@/components/customers/CustomerDialog'
import { queueOperation } from '@/lib/db/ops'

export default function CustomerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const customerId = params.id as string
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Fetch customer from local DB
    const customer = useLiveQuery(
        () => db.customers.get(customerId),
        [customerId]
    )

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await queueOperation('customers', 'DELETE', { id: customerId }, customerId)
            router.push('/dashboard/customers')
        } catch (error) {
            console.error('Failed to delete customer:', error)
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    if (!customer) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Loading customer...</p>
                </div>
            </div>
        )
    }

    const customerType = (customer as any).customFields?.category || 'INDIVIDUAL'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/customers"
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {customerType === 'INDIVIDUAL' && <User className="h-3 w-3 mr-1" />}
                                {customerType === 'BUSINESS' && <Building2 className="h-3 w-3 mr-1" />}
                                {customerType === 'COMPANY' && <Building2 className="h-3 w-3 mr-1" />}
                                {customerType}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Information */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {customer.email || <span className="text-gray-400 italic">Not provided</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {customer.phone || <span className="text-gray-400 italic">Not provided</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {customer.address || <span className="text-gray-400 italic">Not provided</span>}
                                    </p>
                                    {customer.city && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{customer.city}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History Placeholder */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h2>
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet</p>
                        </div>
                    </div>
                </div>

                {/* Account Summary */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Summary</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    TZS {customer.balance?.toLocaleString() || '0.00'}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Credit Limit</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                    {customer.creditLimit ? `TZS ${customer.creditLimit.toLocaleString()}` : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Customer Dialog */}
            <CustomerDialog
                mode="edit"
                customerId={customerId}
                customerData={customer}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Customer"
                description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
                confirmText={isDeleting ? 'Deleting...' : 'Delete'}
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    )
}
