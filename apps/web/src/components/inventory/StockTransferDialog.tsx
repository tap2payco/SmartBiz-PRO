'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { cn } from '@/lib/utils'

const transferSchema = z.object({
    itemId: z.string().min(1, 'Item is required'),
    fromLocationId: z.string().min(1, 'Source location is required'),
    toLocationId: z.string().min(1, 'Destination location is required'),
    quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
    notes: z.string().optional(),
}).refine((data) => data.fromLocationId !== data.toLocationId, {
    message: "Source and destination must be different",
    path: ["toLocationId"],
})

type TransferFormData = z.infer<typeof transferSchema>

interface StockTransferDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    preselectedItemId?: string
}

export function StockTransferDialog({ open, onOpenChange, onSuccess, preselectedItemId }: StockTransferDialogProps) {
    const { getToken } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [locations, setLocations] = useState<any[]>([])
    const [itemOpen, setItemOpen] = useState(false)

    // Load items from Dexie for combobox
    const items = useLiveQuery(() => db.items.toArray()) || []

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            quantity: 1,
        }
    })

    const selectedItemId = watch('itemId')

    // Fetch locations when dialog opens
    useEffect(() => {
        if (open) {
            const fetchLocations = async () => {
                const token = await getToken()
                if (!token) return
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setLocations(data)
                    }
                } catch (console) {
                    // console.error(err)
                }
            }
            fetchLocations()
            if (preselectedItemId) {
                setValue('itemId', preselectedItemId)
            }
        } else {
            reset({ quantity: 1 })
        }
    }, [open, getToken, preselectedItemId, setValue, reset])

    const onSubmit = async (data: TransferFormData) => {
        setIsSubmitting(true)
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-movements/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to process transfer')
            }

            toast.success('Stock transfer successful')
            onSuccess() // This should trigger a refresh of stock levels
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Transfer Stock</DialogTitle>
                    <DialogDescription>
                        Move inventory between locations.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Item</Label>
                        <Popover open={itemOpen} onOpenChange={setItemOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={itemOpen}
                                    className={cn(
                                        "w-full justify-between",
                                        !selectedItemId && "text-muted-foreground"
                                    )}
                                    disabled={!!preselectedItemId}
                                >
                                    {selectedItemId
                                        ? items.find((item) => item.id === selectedItemId)?.name
                                        : "Select item..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search item..." />
                                    <CommandEmpty>No item found.</CommandEmpty>
                                    <CommandGroup>
                                        {items.map((item) => (
                                            <CommandItem
                                                key={item.id}
                                                value={item.name}
                                                onSelect={() => {
                                                    setValue('itemId', item.id)
                                                    setItemOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedItemId === item.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {item.name}
                                                <span className="ml-2 text-xs text-gray-400">({item.sku})</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.itemId && <p className="text-xs text-red-500">{errors.itemId.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fromLocation">From</Label>
                            <Select onValueChange={(val) => setValue('fromLocationId', val)}>
                                <SelectTrigger className={errors.fromLocationId ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.fromLocationId && <p className="text-xs text-red-500">{errors.fromLocationId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="toLocation">To</Label>
                            <Select onValueChange={(val) => setValue('toLocationId', val)}>
                                <SelectTrigger className={errors.toLocationId ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select Destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.toLocationId && <p className="text-xs text-red-500">{errors.toLocationId.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            {...register('quantity')}
                            className={errors.quantity ? 'border-red-500' : ''}
                        />
                        {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Optional transfer notes"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Transfer Stock
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
