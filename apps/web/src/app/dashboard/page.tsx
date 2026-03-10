'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import {
    DollarSign,
    Package,
    Users,
    ShoppingCart,
    Plus,
    Box,
    UserPlus,
    FileText,
    Receipt,
    FileCheck,
    CreditCard,
    ClipboardList,
    Scan,
    Briefcase,
    Award,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LowStockAlert } from '@/components/inventory/LowStockAlert'
import { SalesChart } from '@/components/reports/SalesChart'
import { TopProducts } from '@/components/reports/TopProducts'
import { QuickActionDialogs } from '@/components/dashboard/QuickActionDialogs'
import { CustomerDialog } from '@/components/customers/CustomerDialog'

export default function DashboardPage() {
    const { user, profile, getToken } = useAuth()
    const [organization, setOrganization] = useState<any>(null)
    const [activeProjects, setActiveProjects] = useState<any[]>([])
    const [loyalCustomers, setLoyalCustomers] = useState<any[]>([])
    const [isSyncing, setIsSyncing] = useState(true)

    // Dialog States
    const [openInvoice, setOpenInvoice] = useState(false)
    const [openQuote, setOpenQuote] = useState(false)
    const [openPayment, setOpenPayment] = useState(false)
    const [openExpense, setOpenExpense] = useState(false)
    const [openCustomer, setOpenCustomer] = useState(false)
    const [openScanner, setOpenScanner] = useState(false)

    // Real-time data from IndexedDB
    const itemsCount = useLiveQuery(() => db.items.count()) ?? 0
    const customersCount = useLiveQuery(() => db.customers.count()) ?? 0
    const suppliersCount = useLiveQuery(() => db.suppliers.count()) ?? 0

    // Sync data from API
    useEffect(() => {
        const syncData = async () => {
            if (!user) return

            try {
                const token = await getToken()
                if (!token) return

                // Fetch dashboard stats
                const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                let dashboardStats = null
                if (statsRes.ok) {
                    dashboardStats = await statsRes.json()
                }

                // Fetch organization
                const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (orgRes.ok) {
                    const data = await orgRes.json()
                    setOrganization({ ...data, stats: dashboardStats })
                }

                // Fetch items, customers, and projects
                const [itemsRes, customersRes, projectsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders?type=CUSTOMER`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ])

                const items = itemsRes.ok ? await itemsRes.json() : []
                const customers = customersRes.ok ? await customersRes.json() : []

                // Atomic transaction for caching
                await db.transaction('rw', [db.items, db.customers], async () => {
                    if (Array.isArray(items) && items.length > 0) {
                        const validItems = items.filter(i => i && typeof i === 'object' && i.id)
                        if (validItems.length > 0) await db.items.bulkPut(validItems)
                    }
                    if (Array.isArray(customers) && customers.length > 0) {
                        const validCustomers = customers.filter(c => c && typeof c === 'object' && c.id)
                        if (validCustomers.length > 0) await db.customers.bulkPut(validCustomers)

                        // Set top loyal customers for dashboard
                        const sorted = [...validCustomers].sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
                        setLoyalCustomers(sorted.slice(0, 3))
                    }
                })

                if (projectsRes.ok) {
                    const data = await projectsRes.json()
                    setActiveProjects((data.projects || []).filter((p: any) => p.status === 'ACTIVE').slice(0, 3))
                }
            } catch (error) {
                console.error('Error syncing dashboard data:', error)
            } finally {
                setIsSyncing(false)
            }
        }
        syncData()
    }, [user, getToken])

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome, {profile?.firstName || user?.email}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {organization ? `Here's what's happening at ${organization.name} today.` : 'Configure your business to see full stats.'}
                </p>
            </div>

            {/* Onboarding Banner if skipped */}
            {(!profile?.organizationId && !organization) && (
                <div className="bg-blue-600 rounded-lg shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold">Finish Setting Up Your Business</h3>
                        <p className="opacity-90">To create items, customers, and start selling, you need to set up your organization details.</p>
                    </div>
                    <Link href="/onboarding">
                        <Button variant="secondary" className="whitespace-nowrap">
                            Complete Setup
                        </Button>
                    </Link>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <ActionButton
                        title="Add Invoice"
                        icon={FileCheck}
                        onClick={() => setOpenInvoice(true)}
                        color="text-emerald-600 dark:text-emerald-400"
                    />
                    <ActionButton
                        title="Add Quote"
                        icon={ClipboardList}
                        onClick={() => setOpenQuote(true)}
                        color="text-amber-600 dark:text-amber-400"
                    />
                    <ActionButton
                        title="Add Payment"
                        icon={CreditCard}
                        onClick={() => setOpenPayment(true)}
                        color="text-indigo-600 dark:text-indigo-400"
                    />
                    <ActionButton
                        title="Add Receipt"
                        icon={Receipt}
                        onClick={() => setOpenExpense(true)}
                        color="text-rose-600 dark:text-rose-400"
                    />
                    <ActionButton
                        title="Scan Invoice"
                        icon={Scan}
                        onClick={() => setOpenScanner(true)}
                        color="text-blue-600 dark:text-blue-400"
                    />

                    <div className="md:hidden lg:contents">
                        <ActionButton
                            title="New Sale (POS)"
                            icon={Plus}
                            href="/dashboard/pos"
                            color="text-blue-600"
                        />
                        <ActionButton
                            title="Add Product"
                            icon={Box}
                            href="/dashboard/inventory/new"
                            color="text-gray-600"
                        />
                        <ActionButton
                            title="Add Customer"
                            icon={UserPlus}
                            onClick={() => setOpenCustomer(true)}
                            color="text-purple-600"
                        />
                        <ActionButton
                            title="View Reports"
                            icon={FileText}
                            href="/dashboard/reports"
                            color="text-slate-600"
                        />
                    </div>
                </div>
            </div>

            <QuickActionDialogs
                openInvoice={openInvoice} setOpenInvoice={setOpenInvoice}
                openQuote={openQuote} setOpenQuote={setOpenQuote}
                openPayment={openPayment} setOpenPayment={setOpenPayment}
                openExpense={openExpense} setOpenExpense={setOpenExpense}
                openScanner={openScanner} setOpenScanner={setOpenScanner}
            />

            <CustomerDialog
                open={openCustomer}
                onOpenChange={setOpenCustomer}
            />

            {/* Low Stock Alert */}
            <LowStockAlert className="mb-6" />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    title="Total Sales"
                    value={`${organization?.currency || 'TZS'} ${(organization?.stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Inventory Items"
                    value={itemsCount.toString()}
                    icon={Package}
                    color="bg-green-500"
                />
                <StatCard
                    title="Customers"
                    value={customersCount.toString()}
                    icon={Users}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Open POs"
                    value={(organization?.stats?.pendingOrders || 0).toString()}
                    icon={ShoppingCart}
                    color="bg-purple-500"
                />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-6">
                <SalesChart />
                <TopProducts />
            </div>

            {/* Phase 4: Industrial Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Project Progress Widget */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                            Active Projects
                        </h3>
                        <Link href="/dashboard/projects" className="text-xs text-blue-600 hover:underline flex items-center">
                            View all <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="p-6 space-y-5">
                        {isSyncing ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                        ) : activeProjects.length === 0 ? (
                            <div className="text-center py-6 flex flex-col items-center">
                                <p className="text-sm text-gray-400 italic mb-3">No active projects yet.</p>
                                <Link href="/dashboard/projects">
                                    <Button variant="outline" size="sm" className="text-xs">
                                        Create Your First Project
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            activeProjects.map((proj) => {
                                const completed = proj.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0
                                const total = proj.tasks?.length || 0
                                const progress = total > 0 ? (completed / total) * 100 : 0
                                return (
                                    <div key={proj.id} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-200 truncate pr-4">{proj.name}</span>
                                            <span className="text-xs text-gray-500">{completed}/{total} tasks</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Top Loyal Customers Widget */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-600" />
                            Top Loyal Customers
                        </h3>
                        <Link href="/dashboard/customers" className="text-xs text-amber-600 hover:underline flex items-center">
                            View all <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {isSyncing ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                            ) : loyalCustomers.length === 0 ? (
                                <div className="text-center py-6 flex flex-col items-center">
                                    <p className="text-sm text-gray-400 italic mb-3">No customer data yet.</p>
                                    <Button variant="outline" size="sm" className="text-xs" onClick={() => setOpenCustomer(true)}>
                                        Add Your First Customer
                                    </Button>
                                </div>
                            ) : (
                                loyalCustomers.map((cust, idx) => (
                                    <div key={cust.id} className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                                            ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cust.name}</p>
                                            <p className="text-xs text-gray-500">{Number(cust.loyaltyPoints || 0).toLocaleString()} Points</p>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-[10px] font-bold text-amber-600 border border-amber-100 dark:border-amber-900/30">
                                            VIP
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
                <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    )
}

function ActionButton({ title, icon: Icon, href, onClick, color }: { title: string; icon: any; href?: string; onClick?: () => void, color?: string }) {
    const content = (
        <>
            <div className={`p-2 rounded-full bg-gray-50 dark:bg-gray-900 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors mb-1.5`}>
                <Icon className={`h-5 w-5 ${color || 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white text-center">{title}</span>
        </>
    )

    const className = "flex flex-col items-center justify-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group active:scale-95 shadow-sm hover:shadow-md"

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        )
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    )
}
