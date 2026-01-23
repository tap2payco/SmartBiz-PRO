'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/db'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const categorySchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryDialogProps {
    mode?: 'create' | 'edit'
    categoryId?: string
    categoryData?: any
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CategoryDialog({
    mode = 'create',
    categoryId,
    categoryData,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: CategoryDialogProps) {
    const { profile, getToken } = useAuth()
    const [internalOpen, setInternalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = controlledOnOpenChange || setInternalOpen

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: mode === 'edit' && categoryData ? {
            name: categoryData.name,
            description: categoryData.description || '',
        } : {
            name: '',
            description: '',
        }
    })

    const onSubmit = async (data: CategoryFormData) => {
        setIsSubmitting(true)
        try {
            const token = await getToken()
            if (!token) {
                throw new Error('Not authenticated')
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL

            if (mode === 'edit' && categoryId) {
                // Update existing category via API
                const response = await fetch(`${apiUrl}/categories/${categoryId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    throw new Error('Failed to update category')
                }

                const updatedCategory = await response.json()
                // Update local cache
                await db.categories.put({
                    ...updatedCategory,
                    syncedAt: Date.now()
                })
            } else {
                // Create new category via API
                const response = await fetch(`${apiUrl}/categories`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    throw new Error('Failed to create category')
                }

                const newCategory = await response.json()
                // Add to local cache
                await db.categories.put({
                    ...newCategory,
                    syncedAt: Date.now()
                })
            }

            setOpen(false)
            reset()
        } catch (error) {
            console.error('Failed to save category:', error)
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
                        Add Category
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Category' : 'Add Category'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? 'Update category details.' : 'Create a new category for your items.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="e.g. Electronics"
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Category description..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'edit' ? 'Update' : 'Save'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
