'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Download } from 'lucide-react'
import Barcode from 'react-barcode'
import { queueOperation } from '@/lib/db/ops'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ImageUpload } from '@/components/shared/ImageUpload'

// Validation Schema
const itemSchema = z.object({
    name: z.string().min(2, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    type: z.enum(['good', 'service']),
    costPrice: z.coerce.number().min(0, "Cost price must be positive"),
    sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
    reorderPoint: z.coerce.number().int().min(0).optional(),
    reorderQuantity: z.coerce.number().int().min(0).optional(),
    imageUrl: z.string().optional()
})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemDialogProps {
    mode?: 'create' | 'edit'
    itemId?: string
    itemData?: any
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ItemDialog({
    mode = 'create',
    itemId,
    itemData,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: ItemDialogProps) {
    const { profile, getToken } = useAuth()
    const [internalOpen, setInternalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categories, setCategories] = useState<any[]>([])

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = controlledOnOpenChange || setInternalOpen

    // Load Categories
    useEffect(() => {
        const fetchCategories = async () => {
            console.log('[ItemDialog] Fetching categories, dialog open:', open)
            try {
                // Try local first
                const localCats = await db.categories.toArray()
                console.log('[ItemDialog] Local categories:', localCats.length)
                if (localCats.length > 0) {
                    setCategories(localCats)
                }

                // Sync from API to ensure we have latest
                const token = await getToken()
                console.log('[ItemDialog] Got token:', !!token)
                if (token) {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL
                    console.log('[ItemDialog] Fetching from:', `${apiUrl}/categories`)
                    const res = await fetch(`${apiUrl}/categories`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })

                    console.log('[ItemDialog] Response status:', res.status)
                    if (res.ok) {
                        const data = await res.json()
                        console.log('[ItemDialog] Categories from API:', data.length, data)
                        setCategories(data)
                        // Update local cache
                        if (data.length > 0) {
                            await db.categories.bulkPut(data.map((cat: any) => ({
                                ...cat,
                                syncedAt: Date.now()
                            })))
                        }
                    } else {
                        const errorText = await res.text()
                        console.error('[ItemDialog] API error:', res.status, errorText)
                    }
                }
            } catch (error) {
                console.error('[ItemDialog] Failed to fetch categories:', error)
            }
        }

        if (open) {
            fetchCategories()
        }
    }, [open, getToken])

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: mode === 'edit' && itemData ? {
            name: itemData.name,
            sku: itemData.sku,
            barcode: itemData.barcode || '',
            description: itemData.description || '',
            categoryId: itemData.categoryId || '',
            unit: itemData.unit || 'pcs',
            type: itemData.type || 'good',
            costPrice: Number(itemData.costPrice) || 0,
            sellingPrice: Number(itemData.sellingPrice) || 0,
            reorderPoint: itemData.reorderPoint || 0,
            reorderQuantity: itemData.reorderQuantity || 0,
            imageUrl: itemData.imageUrl || ''
        } : {
            unit: 'pcs',
            type: 'good',
            costPrice: 0,
            sellingPrice: 0,
            reorderPoint: 0,
            reorderQuantity: 0,
            imageUrl: ''
        }
    })

    const barcodeValue = watch('barcode')

    const handleDownloadBarcode = () => {
        if (!barcodeValue) return

        const svg = document.getElementById('barcode-svg')
        if (!svg) {
            console.error('Barcode SVG element not found')
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        // Add XML namespace if missing (required for blob rendering context in some browsers)
        if (!svg.getAttribute('xmlns')) {
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        }

        // Convert SVG to string with proper encoding
        const svgData = new XMLSerializer().serializeToString(svg)
        // Use Base64 to ensure reliable loading and avoiding blob taint issues
        const base64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svgData))) : ''
        const imageSrc = `data:image/svg+xml;base64,${base64}`

        img.onload = () => {
            // Add padding
            const padding = 20
            // Set canvas dimensions based on image + padding
            canvas.width = img.width + (padding * 2)
            canvas.height = img.height + (padding * 2)

            if (ctx) {
                // Fill white background (CRITICAL for PNG transparency issues)
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // Draw image centered
                ctx.drawImage(img, padding, padding)

                try {
                    const pngUrl = canvas.toDataURL('image/png')

                    const link = document.createElement('a')
                    link.href = pngUrl
                    link.download = `SmartBiz-Barcode-${barcodeValue}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)

                    toast.success('Barcode downloaded to Downloads folder')
                } catch (err) {
                    console.error('Error generating PNG data URL:', err)
                    toast.error('Failed to generate PNG')
                }
            }
        }

        img.onerror = (err) => {
            console.error('Error loading SVG for conversion:', err)
            toast.error('Failed to load barcode image')
        }

        img.src = imageSrc
    }

    const onSubmit = async (data: ItemFormData) => {
        setIsSubmitting(true)
        try {
            if (mode === 'edit' && itemId) {
                // Update existing item
                const updatedItem = {
                    ...data,
                    id: itemId
                }
                await queueOperation('items', 'UPDATE', updatedItem, itemId)
                toast.success('Item updated successfully')
            } else {
                // Create new item
                const localId = uuidv4()
                const newItem = {
                    ...data,
                    organizationId: profile?.organizationId || 'temp-org',
                    isActive: true,
                    // Ensure optional fields are handled or use defaults
                    unit: data.unit || 'pcs'
                }
                const cleanItem = JSON.parse(JSON.stringify(newItem)) // Remove undefined
                await queueOperation('items', 'CREATE', cleanItem, localId)
                toast.success('Item created successfully')
            }

            setOpen(false)
            reset()
        } catch (error) {
            console.error('Failed to save item:', error)
            toast.error('Failed to save item')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && mode === 'create' && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? 'Update item information.' : 'Add a new product to your inventory.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic Information</h3>

                        <div className="space-y-3">
                            <Label>Item Type</Label>
                            <RadioGroup
                                defaultValue={watch('type')}
                                onValueChange={(val: 'good' | 'service') => setValue('type', val)}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="good" id="type-good" />
                                    <Label htmlFor="type-good">Goods (Stocked)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="service" id="type-service" />
                                    <Label htmlFor="type-service">Service (Non-stocked)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Item Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder="e.g. Laptop Dell XPS 15"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sku">
                                    SKU <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="sku"
                                    {...register('sku')}
                                    placeholder="e.g. DELL-XPS15-001"
                                />
                                {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="barcode"
                                        {...register('barcode')}
                                        placeholder="e.g. 1234567890123"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            // Generate EAN-13 (Internal prefix 20)
                                            let code = "20"
                                            for (let i = 0; i < 10; i++) code += Math.floor(Math.random() * 10)

                                            // Calculate checksum
                                            let sum = 0
                                            for (let i = 0; i < 12; i++) {
                                                sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
                                            }
                                            const checksum = (10 - (sum % 10)) % 10
                                            setValue('barcode', code + checksum)
                                        }}
                                        title="Generate Random Barcode"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-4 w-4"
                                        >
                                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                            <path d="M16 16h5v5" />
                                        </svg>
                                    </Button>
                                </div>
                                {barcodeValue && (
                                    <div className="mt-2 flex flex-col items-center p-2 border border-gray-100 rounded bg-white">
                                        <div id="barcode-container">
                                            <Barcode
                                                value={barcodeValue}
                                                height={40}
                                                fontSize={14}
                                                renderer="svg"
                                                // @ts-ignore
                                                id="barcode-svg"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mt-1 h-6 text-xs"
                                            onClick={handleDownloadBarcode}
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download PNG
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categoryId">Category</Label>
                                <Select
                                    onValueChange={(value) => setValue('categoryId', value)}
                                    defaultValue={itemData?.categoryId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Product description..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Product Image</Label>
                            <ImageUpload
                                value={watch('imageUrl')}
                                onChange={(url) => setValue('imageUrl', url)}
                            />
                        </div>
                    </div>

                    {/* Pricing & Unit */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pricing & Unit</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select
                                    onValueChange={(value) => setValue('unit', value)}
                                    defaultValue={itemData?.unit || 'pcs'}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pcs">Pieces</SelectItem>
                                        <SelectItem value="kg">Kilograms</SelectItem>
                                        <SelectItem value="liter">Liters</SelectItem>
                                        <SelectItem value="box">Boxes</SelectItem>
                                        <SelectItem value="pack">Packs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Cost Price (TZS)</Label>
                                <Input
                                    id="costPrice"
                                    type="number"
                                    step="0.01"
                                    {...register('costPrice', { valueAsNumber: true })}
                                    placeholder="0.00"
                                />
                                {errors.costPrice && <p className="text-xs text-red-500">{errors.costPrice.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice">Selling Price (TZS)</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    step="0.01"
                                    {...register('sellingPrice', { valueAsNumber: true })}
                                    placeholder="0.00"
                                />
                                {errors.sellingPrice && <p className="text-xs text-red-500">{errors.sellingPrice.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Inventory Settings - Only for Goods */}
                    {watch('type') === 'good' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Inventory Settings</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reorderPoint">Reorder Point</Label>
                                    <Input
                                        id="reorderPoint"
                                        type="number"
                                        {...register('reorderPoint', { valueAsNumber: true })}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                                    <Input
                                        id="reorderQuantity"
                                        type="number"
                                        {...register('reorderQuantity', { valueAsNumber: true })}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-500">Suggested quantity to reorder</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!profile?.organizationId && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                            <p className="font-bold mb-1">Preview Mode</p>
                            <p>You can see how this works, but you must complete your business setup to save items to the database.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !profile?.organizationId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {mode === 'edit' ? 'Updating...' : 'Saving...'}
                                </>
                            ) : (
                                mode === 'edit' ? 'Update Item' : 'Save Item'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
