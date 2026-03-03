'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import {
    ArrowLeft,
    Edit,
    Trash2,
    Mail,
    Phone,
    MapPin,
    Building2,
    User,
    Award,
    MessageSquare,
    Plus,
    History
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CustomerDialog } from '@/components/customers/CustomerDialog'
import { queueOperation } from '@/lib/db/ops'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'

export default function CustomerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const customerId = params.id as string
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [loyaltyDialogOpen, setLoyaltyDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [interactions, setInteractions] = useState<any[]>([])
    const [isAdjustingPoints, setIsAdjustingPoints] = useState(false)
    const [adjustmentPoints, setAdjustmentPoints] = useState(0)

    // Fetch customer from local DB
    const customer = useLiveQuery(
        () => db.customers.get(customerId),
        [customerId]
    )

    const fetchInteractions = async () => {
        try {
            const token = await getToken()
            // Note: Assuming there's an endpoint for this. If not, we'll need to create it.
            // For now, let's fetch customer details which might include interactions.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                // Update local cache if loyalty points differ
                if (data.stakeholder.loyaltyPoints !== customer?.loyaltyPoints) {
                    await db.customers.update(customerId, { loyaltyPoints: data.stakeholder.loyaltyPoints })
                }
                // Update interactions if available
                setInteractions(data.stakeholder.interactions || [])
            }
        } catch (error) {
            console.error('Failed to fetch stakeholder details:', error)
        }
    }

    useEffect(() => {
        fetchInteractions()
    }, [customerId, getToken])

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

    const handleAdjustPoints = async () => {
        setIsAdjustingPoints(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders/${customerId}/loyalty`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ points: adjustmentPoints })
            })

            if (res.ok) {
                toast.success('Loyalty points adjusted')
                setLoyaltyDialogOpen(false)
                fetchInteractions() // Refresh data
            }
        } catch (error) {
            toast.error('Failed to adjust points')
        } finally {
            setIsAdjustingPoints(false)
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

    const customerType = (customer as any).stakeholderType || 'INDIVIDUAL'

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
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
                                {customerType}
                            </span>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                <Award className="h-3 w-3 mr-1" />
                                {Number(customer.loyaltyPoints || 0).toLocaleString()} Points
                            </Badge>
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
                {/* Contact Information & History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            </div>
                            <div className="space-y-4">
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
                    </div>

                    {/* Interaction & Transaction History */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="h-5 w-5 text-purple-600" />
                                Recent Activity
                            </h2>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                                <Plus className="h-4 w-4 mr-1" /> Log Interaction
                            </Button>
                        </div>
                        <div className="p-0">
                            {interactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <MessageSquare className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                    <p>No activity recorded yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {interactions.map((ix: any) => (
                                        <div key={ix.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px]">{ix.type}</Badge>
                                                    <p className="text-sm font-medium">{ix.subject}</p>
                                                </div>
                                                <span className="text-xs text-gray-400">{format(new Date(ix.interactionDate), 'MMM dd, yyyy')}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{ix.notes}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Summary & Loyalty */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    TZS {Number(customer.balance || 0).toLocaleString()}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Credit Limit</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                    {customer.creditLimit ? `TZS ${Number(customer.creditLimit).toLocaleString()}` : 'No Limit'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                                <Award className="h-5 w-5" />
                                Loyalty Rewards
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                                {Number(customer.loyaltyPoints || 0).toLocaleString()}
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400 ml-1 uppercase">pts</span>
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                                Points earned automatically on every purchase (1% back).
                            </p>
                            <Dialog open={loyaltyDialogOpen} onOpenChange={setLoyaltyDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full mt-4 bg-white dark:bg-gray-800 border-amber-200 text-amber-700 hover:bg-amber-100">
                                        Adjust Points
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adjust Loyalty Points</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Enter points change (positive to add, negative to subtract)</Label>
                                            <Input
                                                type="number"
                                                value={adjustmentPoints}
                                                onChange={e => setAdjustmentPoints(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setLoyaltyDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            className="bg-amber-600 hover:bg-amber-700"
                                            onClick={handleAdjustPoints}
                                            disabled={isAdjustingPoints}
                                        >
                                            {isAdjustingPoints ? 'Processing...' : 'Save Adjustment'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
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

