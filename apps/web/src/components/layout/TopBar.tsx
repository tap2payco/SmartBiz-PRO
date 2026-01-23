'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Menu, Bell, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TopBarProps {
    setSidebarOpen: (open: boolean) => void
}

export function TopBar({ setSidebarOpen }: TopBarProps) {
    const { user, profile, signOut, getToken } = useAuth()
    const router = useRouter()
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [organization, setOrganization] = useState<any>(null)

    // Fetch organization info for the header
    useEffect(() => {
        const fetchOrg = async () => {
            if (!user) return
            try {
                const token = await getToken()
                if (!token) return

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                if (response.ok) {
                    const data = await response.json()
                    setOrganization(data.organization)
                }
            } catch (e) {
                console.error("Failed to fetch org for header", e)
            }
        }
        fetchOrg()
    }, [user])

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm h-16">
            <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
                {/* Left: Mobile Menu Toggle & Organization Name */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {organization?.name || 'SmartBiz Pro'}
                        </span>
                        {organization && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {organization.industry}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-4">
                    {/* Notifications (Placeholder) */}
                    <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative">
                        <Bell className="h-6 w-6" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex items-center gap-2 max-w-xs bg-white dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-200 font-medium">
                                {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                />
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {profile?.firstName} {profile?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <Link
                                        href="/dashboard/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Your Profile
                                    </Link>
                                    <Link
                                        href="/dashboard/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
