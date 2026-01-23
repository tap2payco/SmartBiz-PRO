'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { queueOperation } from '@/lib/db/ops'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'
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

// Validation Schema
const customerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    category: z.enum(['INDIVIDUAL', 'BUSINESS', 'COMPANY']),
    taxId: z.string().optional(),
    creditLimit: z.number().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerDialogProps {
    mode?: 'create' | 'edit'
    customerId?: string
    customerData?: any
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CustomerDialog({
    mode = 'create',
    customerId,
    customerData,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: CustomerDialogProps) {
    const { profile } = useAuth()
    const [internalOpen, setInternalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = controlledOnOpenChange || setInternalOpen

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: mode === 'edit' && customerData ? {
            name: customerData.name,
            email: customerData.email || '',
            phone: customerData.phone || '',
            address: customerData.address || '',
            city: customerData.city || '',
            category: customerData.customFields?.category || 'INDIVIDUAL',
            taxId: customerData.taxId || '',
            creditLimit: customerData.creditLimit
        } : {
            category: 'INDIVIDUAL'
        }
    })

    const category = watch('category')

    const onSubmit = async (data: CustomerFormData) => {
        setIsSubmitting(true)
        try {
            if (mode === 'edit' && customerId) {
                // Update existing customer
                const updatedCustomer = {
                    ...data,
                    id: customerId,
                    customFields: { category: data.category }
                }
                await queueOperation('customers', 'UPDATE', updatedCustomer, customerId)
            } else {
                // Create new customer
                const localId = uuidv4()
                const newCustomer = {
                    ...data,
                    organizationId: profile?.organizationId || 'temp-org',
                    type: 'CUSTOMER',
                    balance: 0,
                    isActive: true,
                    customFields: { category: data.category }
                }
                await queueOperation('customers', 'CREATE', newCustomer, localId)
            }

            setOpen(false)
            reset()
        } catch (error) {
            console.error('Failed to save customer:', error)
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
                        Add Customer
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? 'Update customer information.' : 'Create a new customer profile.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">

                    {/* Customer Category */}
                    <div className="space-y-3">
                        <Label>Customer Type</Label>
                        <RadioGroup
                            defaultValue="INDIVIDUAL"
                            onValueChange={(val) => setValue('category', val as any)}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-full">
                                <RadioGroupItem value="INDIVIDUAL" id="r1" />
                                <Label htmlFor="r1" className="cursor-pointer flex-1">Individual</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-full">
                                <RadioGroupItem value="BUSINESS" id="r2" />
                                <Label htmlFor="r2" className="cursor-pointer flex-1">Business</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-full">
                                <RadioGroupItem value="COMPANY" id="r3" />
                                <Label htmlFor="r3" className="cursor-pointer flex-1">Company</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {category === 'INDIVIDUAL' ? 'Full Name' : 'Company Name'} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder={category === 'INDIVIDUAL' ? "e.g. John Doe" : "e.g. Acme Corp"}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="john@example.com"
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    {...register('phone')}
                                    placeholder="+255..."
                                />
                            </div>
                        </div>

                        {(category === 'BUSINESS' || category === 'COMPANY') && (
                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID / TIN</Label>
                                <Input
                                    id="taxId"
                                    {...register('taxId')}
                                    placeholder="Tax Identification Number"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                {...register('address')}
                                placeholder="Street address, P.O. Box..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City / Region</Label>
                            <Input
                                id="city"
                                {...register('city')}
                                placeholder="e.g. Dar es Salaam"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {mode === 'edit' ? 'Updating...' : 'Saving...'}
                                </>
                            ) : (
                                mode === 'edit' ? 'Update Customer' : 'Save Customer'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
