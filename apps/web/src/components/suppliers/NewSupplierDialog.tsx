'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Building2, User } from 'lucide-react'

const supplierSchema = z.object({
    stakeholderType: z.enum(['INDIVIDUAL', 'BUSINESS']),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    city: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
})

type SupplierFormData = z.infer<typeof supplierSchema>

interface NewSupplierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplier?: any
}

export default function NewSupplierDialog({
    open,
    onOpenChange,
    supplier,
}: NewSupplierDialogProps) {
    const { getToken } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<SupplierFormData>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            stakeholderType: 'INDIVIDUAL',
            name: '',
            phone: '',
            email: '',
            city: '',
            address: '',
            taxId: '',
        },
    })

    const stakeholderType = watch('stakeholderType')

    // Populate form when editing
    useEffect(() => {
        if (supplier) {
            reset({
                stakeholderType: supplier.stakeholderType || 'INDIVIDUAL',
                name: supplier.name || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                city: supplier.city || '',
                address: supplier.address || '',
                taxId: supplier.taxId || '',
            })
        } else {
            reset({
                stakeholderType: 'INDIVIDUAL',
                name: '',
                phone: '',
                email: '',
                city: '',
                address: '',
                taxId: '',
            })
        }
    }, [supplier, reset])

    const onSubmit = async (data: SupplierFormData) => {
        setIsSubmitting(true)

        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            const payload = {
                ...data,
                type: 'SUPPLIER' as const,
            }

            const url = supplier
                ? `${process.env.NEXT_PUBLIC_API_URL}/stakeholders/${supplier.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/stakeholders`

            const method = supplier ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                const result = await res.json()
                const savedSupplier = result.stakeholder || result

                // Update IndexedDB
                await db.suppliers.put(savedSupplier)

                toast.success(
                    supplier ? 'Supplier updated successfully' : 'Supplier created successfully'
                )
                onOpenChange(false)
                reset()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to save supplier')
            }
        } catch (error) {
            console.error('Error saving supplier:', error)
            toast.error('Failed to save supplier')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                    </DialogTitle>
                    <DialogDescription>
                        {supplier
                            ? 'Update supplier information'
                            : 'Add a new supplier to your system'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Supplier Type Selection */}
                    <div className="space-y-3">
                        <Label>Supplier Type</Label>
                        <RadioGroup
                            value={stakeholderType}
                            onValueChange={(value) =>
                                setValue('stakeholderType', value as 'INDIVIDUAL' | 'BUSINESS')
                            }
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem
                                    value="INDIVIDUAL"
                                    id="individual"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="individual"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <User className="mb-3 h-6 w-6" />
                                    <span className="text-sm font-medium">Individual</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem
                                    value="BUSINESS"
                                    id="business"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="business"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <Building2 className="mb-3 h-6 w-6" />
                                    <span className="text-sm font-medium">Business</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {stakeholderType === 'BUSINESS' ? 'Business Name' : 'Full Name'} *
                            </Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder={
                                    stakeholderType === 'BUSINESS'
                                        ? 'ABC Suppliers Ltd'
                                        : 'John Doe'
                                }
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                {...register('phone')}
                                placeholder="+255 123 456 789"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="supplier@example.com"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                {...register('city')}
                                placeholder="Dar es Salaam"
                            />
                        </div>

                        {stakeholderType === 'BUSINESS' && (
                            <div className="space-y-2">
                                <Label htmlFor="taxId">TIN (Tax ID)</Label>
                                <Input
                                    id="taxId"
                                    {...register('taxId')}
                                    placeholder="123-456-789"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            {...register('address')}
                            placeholder="Street address, building, etc."
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Saving...'
                                : supplier
                                    ? 'Update Supplier'
                                    : 'Add Supplier'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
