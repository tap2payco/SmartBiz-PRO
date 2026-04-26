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

    // Real-time data from IndexedDB (Industrial Offline-First)
    const itemsCount = useLiveQuery(() => db.items.count()) ?? 0
    const customersCount = useLiveQuery(() => db.customers.count()) ?? 0
    
    // Load cached metadata (stats & org)
    const cachedStats = useLiveQuery(() => db.metadata.get('dashboard_stats'))
    const cachedOrg = useLiveQuery(() => db.metadata.get('current_organization'))
    
    const organization = cachedOrg?.data
    const dashboardStats = cachedStats?.data

    // Trigger Background Sync
    useEffect(() => {
        const performSync = async () => {
            if (!user) return
            setIsSyncing(true)

            try {
                const token = await getToken()
                if (!token) return

                // 1. Run Background Sync Engine
                const { processOutbox } = await import('@/lib/db/sync')
                await processOutbox(getToken)

                // 2. Refresh Dashboard Specific Stats (Industrial caching)
                const [statsRes, orgRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ])

                if (statsRes.ok) {
                    const data = await statsRes.json()
                    await db.metadata.put({ id: 'dashboard_stats', data, updatedAt: Date.now() })
                }

                if (orgRes.ok) {
                    const data = await orgRes.json()
                    await db.metadata.put({ id: 'current_organization', data, updatedAt: Date.now() })
                }

            } catch (error) {
                console.error('[Dashboard] Background sync failed:', error)
            } finally {
                setIsSyncing(false)
            }
        }

        performSync()
        const interval = setInterval(performSync, 60000) // Sync every minute
        return () => clearInterval(interval)
    }, [user, getToken])

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="glass rounded-3xl p-8 mb-8 relative overflow-hidden border border-white/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                            Welcome back, {profile?.firstName || user?.email}!
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                            {organization ? `Managed by ${organization.name} • ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'Finish your setup to unlock full business intelligence.'}
                        </p>
                    </div>
                    
                    {/* Industrial Sync Status */}
                    <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border backdrop-blur-md transition-all duration-500 ${isSyncing ? 'bg-primary/5 border-primary/20 ring-4 ring-primary/5' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                        {isSyncing ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Sync</span>
                            <span className={`text-xs font-bold ${isSyncing ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {isSyncing ? 'Synchronizing Data...' : 'System Fully Synced'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-3xl p-6 mb-8">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 px-2">
                    Operational Shortcuts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <ActionButton
                        title="New Invoice"
                        icon={FileCheck}
                        onClick={() => setOpenInvoice(true)}
                        color="bg-emerald-500"
                    />
                    <ActionButton
                        title="Draft Quote"
                        icon={ClipboardList}
                        onClick={() => setOpenQuote(true)}
                        color="bg-amber-500"
                    />
                    <ActionButton
                        title="Record Payment"
                        icon={CreditCard}
                        onClick={() => setOpenPayment(true)}
                        color="bg-indigo-500"
                    />
                    <ActionButton
                        title="Log Expense"
                        icon={Receipt}
                        onClick={() => setOpenExpense(true)}
                        color="bg-rose-500"
                    />
                    <ActionButton
                        title="AI Scanner"
                        icon={Scan}
                        onClick={() => setOpenScanner(true)}
                        color="bg-blue-500"
                    />

                    <div className="md:hidden lg:contents">
                        <ActionButton
                            title="POS Mode"
                            icon={ShoppingCart}
                            href="/dashboard/pos"
                            color="bg-violet-500"
                        />
                        <ActionButton
                            title="New Product"
                            icon={Package}
                            href="/dashboard/inventory/new"
                            color="bg-slate-700"
                        />
                        <ActionButton
                            title="CRM"
                            icon={Users}
                            onClick={() => setOpenCustomer(true)}
                            color="bg-fuchsia-500"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Gross Revenue"
                    value={`${organization?.currency || 'TZS'} ${(organization?.stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    gradient="from-blue-600 to-indigo-600"
                />
                <StatCard
                    title="Active Stock"
                    value={itemsCount.toLocaleString()}
                    icon={Package}
                    gradient="from-emerald-500 to-teal-600"
                />
                <StatCard
                    title="Client Base"
                    value={customersCount.toLocaleString()}
                    icon={Users}
                    gradient="from-amber-500 to-orange-600"
                />
                <StatCard
                    title="Pipeline"
                    value={(organization?.stats?.pendingOrders || 0).toString()}
                    icon={ShoppingCart}
                    gradient="from-violet-500 to-purple-600"
                />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 mb-8">
                <div className="lg:col-span-4 glass-card rounded-3xl p-6">
                    <SalesChart />
                </div>
                <div className="lg:col-span-3 glass-card rounded-3xl p-6">
                    <TopProducts />
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, gradient }: any) {
    return (
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500`} />
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-primary/20`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12.5%</span>
            </div>
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-tight mb-1">{title}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
            </div>
        </div>
    )
}

function ActionButton({ title, icon: Icon, href, onClick, color }: any) {
    const content = (
        <div className="flex flex-col items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{title}</span>
        </div>
    )

    const className = "glass-card p-5 flex flex-col items-center justify-center rounded-2xl group active:scale-95"

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
