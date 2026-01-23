'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Truck,
    FileText,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}

const NAVIGATION = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Sales', href: '/dashboard/sales', icon: FileText },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Suppliers', href: '/dashboard/suppliers', icon: Truck },
    { name: 'Purchases', href: '/dashboard/purchases', icon: FileText },
    { name: 'Finance', href: '/dashboard/finance', icon: Wallet },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
                    isOpen ? "opacity-100 ease-out duration-300" : "opacity-0 ease-in duration-200 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar component */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                SmartBiz
                            </span>
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {NAVIGATION.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <item.icon
                                        className={cn(
                                            "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                            isActive
                                                ? "text-blue-700 dark:text-blue-200"
                                                : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
                                        )}
                                    />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer / User Info could go here if not in header */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-center text-xs text-gray-400">
                            v1.0.0
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
