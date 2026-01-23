'use client'

import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View and export business reports.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data (Coming Soon)
                    </Button>
                </div>
            </div>


            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Available Reports
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer group">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">Sales Summary</h4>
                        <p className="text-sm text-gray-500 mt-1">Daily sales breakdown by payment method.</p>
                    </div>
                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer group">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">Inventory Valuation</h4>
                        <p className="text-sm text-gray-500 mt-1">Current stock value and low stock items.</p>
                    </div>
                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer group">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">Customer Insights</h4>
                        <p className="text-sm text-gray-500 mt-1">Top spending customers and growth.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
