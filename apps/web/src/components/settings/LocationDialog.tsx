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
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const locationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['WAREHOUSE', 'STORE', 'OTHER']),
    address: z.string().optional(),
})

type LocationFormData = z.infer<typeof locationSchema>

interface LocationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    location?: any
    onSuccess: () => void
}

export function LocationDialog({ open, onOpenChange, location, onSuccess }: LocationDialogProps) {
    const { getToken } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            type: 'STORE',
            name: '',
            address: ''
        }
    })

    useEffect(() => {
        if (open) {
            if (location) {
                reset({
                    name: location.name,
                    type: location.type,
                    address: location.address || ''
                })
            } else {
                reset({
                    type: 'STORE',
                    name: '',
                    address: ''
                })
            }
        }
    }, [open, location, reset])

    const onSubmit = async (data: LocationFormData) => {
        setIsSubmitting(true)
        try {
            const token = await getToken()
            if (!token) return

            const url = location
                ? `${process.env.NEXT_PUBLIC_API_URL}/locations/${location.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/locations`

            const method = location ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to save location')
            }

            toast.success(location ? 'Location updated' : 'Location created')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error saving location:', error)
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{location ? 'Edit Location' : 'Add Location'}</DialogTitle>
                    <DialogDescription>
                        Define a physical location for your inventory.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="e.g. Main Store"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            onValueChange={(val) => setValue('type', val as any)}
                            defaultValue={location?.type || 'STORE'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STORE">Store (Shop)</SelectItem>
                                <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            {...register('address')}
                            placeholder="Optional address details"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {location ? 'Save Changes' : 'Create Location'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
