'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Plus, Trash2, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { cn } from '@/lib/utils'

const transferSchema = z.object({
    sourceLocationId: z.string().min(1, 'Source location is required'),
    destinationLocationId: z.string().min(1, 'Destination location is required'),
    notes: z.string().optional(),
    driverName: z.string().optional(),
    vehicleNumber: z.string().optional(),
    items: z.array(z.object({
        itemId: z.string().min(1, 'Item is required'),
        quantity: z.coerce.number().int().positive('Quantity must be greater than 0')
    })).min(1, 'At least one item is required')
}).refine((data) => data.sourceLocationId !== data.destinationLocationId, {
    message: "Source and destination must be different",
    path: ["destinationLocationId"],
})

type TransferFormData = z.infer<typeof transferSchema>

export default function NewTransferPage() {
    const { getToken } = useAuth()
    const router = useRouter()
    const [locations, setLocations] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [comboboxOpen, setComboboxOpen] = useState<Record<number, boolean>>({})

    // Load items from Dexie
    const items = useLiveQuery(() => db.items.toArray()) || []

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            items: [{ itemId: '', quantity: 1 }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    })

    const watchedItems = watch('items')

    useEffect(() => {
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
            } catch (error) {
                console.error('Failed to load locations', error)
            }
        }
        fetchLocations()
    }, [getToken])

    const onSubmit = async (data: TransferFormData) => {
        setIsSubmitting(true)
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create transfer')
            }

            toast.success('Transfer draft created')
            router.push('/dashboard/inventory/transfers')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Stock Transfer</h1>
                <p className="text-gray-500 dark:text-gray-400">Create a transfer document to move stock.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Source Location (From)</Label>
                            <Select onValueChange={(val) => setValue('sourceLocationId', val)}>
                                <SelectTrigger className={errors.sourceLocationId ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.sourceLocationId && <p className="text-xs text-red-500">{errors.sourceLocationId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Destination Location (To)</Label>
                            <Select onValueChange={(val) => setValue('destinationLocationId', val)}>
                                <SelectTrigger className={errors.destinationLocationId ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select Destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.destinationLocationId && <p className="text-xs text-red-500">{errors.destinationLocationId.message}</p>}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                {...register('notes')}
                                placeholder="Optional description of the transfer..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Driver Name (Optional)</Label>
                            <Input {...register('driverName')} placeholder="e.g. John Doe" />
                        </div>

                        <div className="space-y-2">
                            <Label>Vehicle Number (Optional)</Label>
                            <Input {...register('vehicleNumber')} placeholder="e.g. T 123 ABC" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Items to Transfer</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: '', quantity: 1 })}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <Popover
                                        open={comboboxOpen[index]}
                                        onOpenChange={(open) => setComboboxOpen(prev => ({ ...prev, [index]: open }))}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between",
                                                    !watchedItems[index]?.itemId && "text-muted-foreground",
                                                    errors.items?.[index]?.itemId && "border-red-500"
                                                )}
                                            >
                                                {watchedItems[index]?.itemId
                                                    ? items.find((item) => item.id === watchedItems[index].itemId)?.name
                                                    : "Select item"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search item..." />
                                                <CommandEmpty>No item found.</CommandEmpty>
                                                <CommandGroup>
                                                    {items.map((item) => (
                                                        <CommandItem
                                                            key={item.id}
                                                            value={item.name}
                                                            onSelect={() => {
                                                                setValue(`items.${index}.itemId`, item.id)
                                                                setComboboxOpen(prev => ({ ...prev, [index]: false }))
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    watchedItems[index]?.itemId === item.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {item.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.items?.[index]?.itemId && (
                                        <p className="text-xs text-red-500 mt-1">Item required</p>
                                    )}
                                </div>

                                <div className="w-[120px]">
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Qty"
                                        {...register(`items.${index}.quantity`)}
                                        className={errors.items?.[index]?.quantity ? 'border-red-500' : ''}
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {errors.items && <p className="text-sm text-red-500">{errors.items.message}</p>}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Draft Transfer
                    </Button>
                </div>
            </form>
        </div>
    )
}
