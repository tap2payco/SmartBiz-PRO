'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileSpreadsheet, Download } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface ImportedItem {
    name: string
    sku: string
    sellingPrice: string
    costPrice: string
    quantity: string
    category: string // Will be categoryId or resolved logic later
    description?: string
    unit?: string
    barcode?: string
}

export default function ImportItemsPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)
        parseFile(file)
    }

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as any[]
                // Basic Validation
                const validated = data.map((row, index) => {
                    const errors: string[] = []
                    if (!row.name) errors.push('Name is required')
                    if (!row.sku) errors.push('SKU is required')
                    if (!row.sellingPrice || isNaN(row.sellingPrice)) errors.push('Valid Price is required')

                    return { ...row, errors, id: index }
                })

                setPreviewData(validated)
                setStats({
                    total: validated.length,
                    valid: validated.filter(i => i.errors.length === 0).length,
                    invalid: validated.filter(i => i.errors.length > 0).length
                })
            },
            error: (error) => {
                toast.error('Failed to parse CSV: ' + error.message)
            }
        })
    }

    const handleImport = async () => {
        const validItems = previewData.filter(i => i.errors.length === 0)
        if (validItems.length === 0) {
            toast.error('No valid items to import')
            return
        }

        setIsUploading(true)
        try {
            const token = await getToken()

            // Format for API
            const payload = validItems.map(item => ({
                name: item.name,
                sku: item.sku,
                sellingPrice: parseFloat(item.sellingPrice),
                costPrice: item.costPrice ? parseFloat(item.costPrice) : 0,
                description: item.description || '',
                unit: item.unit || 'pcs',
                quantity: item.quantity ? parseInt(item.quantity) : 0,
                // categoryId: '...' // TODO: Resolve Category logic. For now optional.
                barcode: item.barcode || undefined
            }))

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const result = await res.json()
                toast.success(result.message)
                router.push('/dashboard/inventory')
            } else {
                const error = await res.json()
                toast.error('Import failed: ' + (error.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Failed to upload items')
        } finally {
            setIsUploading(false)
        }
    }

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "name,sku,sellingPrice,costPrice,quantity,unit,barcode,description\n"
            + "Example Item,SKU-001,15000,10000,50,pcs,12345678,Sample Description";

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "smartbiz_items_template.csv");
        document.body.appendChild(link);
        link.click();
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Import Inventory</h1>
                    <p className="text-muted-foreground">Bulk upload items via CSV</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Uploader Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Upload File</CardTitle>
                        <CardDescription>Select a .csv file to start</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500"
                                >
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">CSV up to 10MB</p>
                        </div>

                        <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                            <Download className="mr-2 h-4 w-4" /> Download Template
                        </Button>

                        {stats.total > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <div className="flex justify-between text-sm">
                                    <span>Total Rows:</span>
                                    <span className="font-bold">{stats.total}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Valid Rows:</span>
                                    <span className="font-bold">{stats.valid}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Invalid Rows:</span>
                                    <span className="font-bold">{stats.invalid}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full"
                            disabled={!file || stats.valid === 0 || isUploading}
                            onClick={handleImport}
                        >
                            {isUploading ? 'Importing...' : 'Complete Import'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Table */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Data Preview</CardTitle>
                        <CardDescription>Review item details before importing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {previewData.length > 0 ? (
                            <div className="border rounded-md max-h-[600px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Qty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row) => (
                                            <TableRow key={row.id} className={row.errors.length > 0 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                                <TableCell>
                                                    {row.errors.length === 0 ? (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <div className="group relative">
                                                            <AlertCircle className="h-5 w-5 text-red-500 cursor-help" />
                                                            <div className="invisible group-hover:visible absolute left-0 top-6 bg-black text-white text-xs p-2 rounded w-48 z-10">
                                                                {row.errors.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.sku}</TableCell>
                                                <TableCell>{row.sellingPrice}</TableCell>
                                                <TableCell>{row.quantity || 0}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
                                <FileSpreadsheet className="h-12 w-12 opacity-20 mb-2" />
                                <p>No data loaded</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
