'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (loading) return

        if (!user) {
            router.push('/login')
            return
        }

        // Check if user has explicitly skipped onboarding for this session
        const hasSkipped = typeof window !== 'undefined' ? sessionStorage.getItem('skipOnboarding') === 'true' : false

        // If user is logged in but has no profile/organization, forced to onboarding UNLESS skipped
        if (user && !profile && pathname !== '/onboarding' && !hasSkipped) {
            router.push('/onboarding')
            return
        }

        // If user has profile but is trying to access onboarding, redirect to dashboard
        if (user && profile && pathname === '/onboarding') {
            router.push('/dashboard')
            return
        }

    }, [user, profile, loading, router, pathname])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) return null
    if (!profile && pathname !== '/onboarding') return null

    if (!user) {
        return null
    }

    return <>{children}</>
}
