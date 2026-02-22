'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Loader2, Camera, Upload, Trash2, X, Scan } from 'lucide-react'
import { QRScanner } from './QRScanner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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

interface ExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ExpenseDialog({ open, onOpenChange }: ExpenseDialogProps) {
    const { getToken } = useAuth()
    const [categories, setCategories] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [categoryId, setCategoryId] = useState<string>('')
    const [accountId, setAccountId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [receiptImage, setReceiptImage] = useState<string | null>(null)
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const qrScannerRef = useRef<any>(null)

    // Fetch dependencies
    useEffect(() => {
        const fetchData = async () => {
            const token = await getToken()
            const [catRes, accRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ])

            if (catRes.ok) setCategories(await catRes.json())
            if (accRes.ok) {
                const accData = await accRes.json()
                setAccounts(accData)
                const defaultCash = accData.find((a: any) => a.type === 'CASH')
                if (defaultCash) setAccountId(defaultCash.id)
            }
        }
        if (open) fetchData()
    }, [open, getToken])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setReceiptImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerCamera = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleScan = (data: string) => {
        try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'SMARTBIZ_SALE') {
                setAmount(parsed.total)
                setDescription(`Payment for SmartBiz Sale #${parsed.number}`)
                toast.success(`Identified Sale #${parsed.number}`)
            } else {
                toast.info('Valid QR but not a SmartBiz receipt')
            }
        } catch (e) {
            toast.error('Invalid QR code format')
        }
    }

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount')
        if (!description) return toast.error('Please enter a description')
        if (!accountId) return toast.error('Please select a payment account')

        setIsSubmitting(true)
        try {
            const token = await getToken()
            const payload = {
                categoryId: categoryId || undefined,
                description,
                amount: Number(amount),
                expenseDate: new Date().toISOString(),
                paymentMethod: accounts.find(a => a.id === accountId)?.type || 'CASH',
                accountId, // Note: The backend needs to handle bank transaction creation for this
                notes: receiptImage ? 'Receipt attached (Image Data)' : ''
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Expense recorded successfully')
                onOpenChange(false)
                resetForm()
            } else {
                toast.error('Failed to record expense')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setAmount('')
        setDescription('')
        setCategoryId('')
        setReceiptImage(null)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Expense / Receipt</DialogTitle>
                    <DialogDescription>Record a new business expense and capture the receipt.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="font-bold border-blue-200"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description / Vendor</Label>
                        <Input
                            placeholder="e.g. Office Supplies from Acme"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Paid From</Label>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Receipt Photo</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 min-h-[120px]">
                            {receiptImage ? (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black flex items-center justify-center">
                                    <img src={receiptImage} alt="Receipt preview" className="h-full object-contain" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                        onClick={() => setReceiptImage(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={triggerCamera}
                                            className="flex gap-2"
                                        >
                                            <Camera className="h-4 w-4" /> Take Photo
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsScannerOpen(true)}
                                            className="flex gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                                        >
                                            <Scan className="h-4 w-4" /> Scan QR
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={triggerCamera}
                                            className="flex gap-2"
                                        >
                                            <Upload className="h-4 w-4" /> Upload
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Scan system QR or upload photo</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <QRScanner
                        open={isScannerOpen}
                        onOpenChange={setIsScannerOpen}
                        onScan={handleScan}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Expense
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
