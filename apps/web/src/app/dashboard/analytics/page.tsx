'use client'

import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    Business Analytics
                </h1>
                <p className="text-muted-foreground">
                    Deep dive into your sales performance and inventory efficiency.
                </p>
            </div>

            <AnalyticsDashboard />
        </div>
    )
}
