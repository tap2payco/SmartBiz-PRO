import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SmartBiz Pro ERP',
    description: 'Offline-first ERP for Retail & Wholesale',
    manifest: '/manifest.json',
}

import { SyncProvider } from '@/contexts/SyncContext'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <AuthProvider>
                    <SyncProvider>
                        {children}
                        <Toaster position="top-right" richColors />
                    </SyncProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
