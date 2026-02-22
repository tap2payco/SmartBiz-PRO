'use client'

import Link from 'next/link'
import { FileText, DollarSign, Receipt, CreditCard, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const financeModules = [
    {
        title: 'Supplier Bills',
        description: 'Manage payables, track due dates, and record payments',
        href: '/dashboard/finance/bills',
        icon: FileText,
        color: 'bg-blue-500'
    },
    {
        title: 'Payments',
        description: 'View payment history and outgoing transactions',
        href: '/dashboard/finance/payments',
        icon: DollarSign,
        color: 'bg-green-500'
    },
    {
        title: 'Expenses',
        description: 'Track operational expenses (Rent, Utilities)',
        href: '/dashboard/finance/expenses',
        icon: Receipt,
        color: 'bg-orange-500'
    },
    {
        title: 'Cash Management',
        description: 'Manage bank accounts, cash drawers, and transfers',
        href: '/dashboard/finance/cash',
        icon: CreditCard,
        color: 'bg-purple-500'
    },
    {
        title: 'Financial Reports',
        description: 'Profit & Loss (P&L), Revenue vs Expenses',
        href: '/dashboard/finance/reports',
        icon: TrendingUp,
        color: 'bg-indigo-500'
    }
]

import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@smartbiz/shared'

export default function FinancePage() {
    const { checkPermission } = useAuth()

    const filteredModules = financeModules.filter(module => {
        if (module.title === 'Financial Reports') {
            return checkPermission(PERMISSIONS.REPORTS_FINANCIAL)
        }
        return true
    })

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Management</h1>
                <p className="text-muted-foreground">Manage your business finances, bills, and payments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredModules.map((module) => (
                    <Link
                        key={module.title}
                        href={module.href}
                    >
                        <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02]">
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-2`}>
                                    <module.icon className="w-6 h-6 text-white" />
                                </div>
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                <CardDescription>{module.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
