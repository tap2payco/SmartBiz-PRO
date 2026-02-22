'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    Building2,
    Globe,
    Coins,
    Briefcase,
    Save,
    Loader2,
    CheckCircle2,
    Plus,
    FileText,
    AlertCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LocationsTab } from '@/components/settings/LocationsTab'
import { UsersTab } from '@/components/settings/UsersTab'

const settingsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    industry: z.enum(['RETAIL', 'WHOLESALE', 'MANUFACTURING', 'HEALTHCARE', 'EDUCATION', 'NGO']),
    country: z.string().length(2, "Country code must be 2 characters (e.g. TZ)"),
    currency: z.string().length(3, "Currency code must be 3 characters (e.g. TZS)"),
    taxEnabled: z.boolean(),
    vatRate: z.number().min(0).max(100),
    fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/, "Format must be MM-DD"),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
    const { profile, getToken, refreshProfile } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [organization, setOrganization] = useState<any>(null)

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
    })

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const token = await getToken()
                if (!token) return

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data.organization) {
                        setOrganization(data.organization)
                        reset({
                            currency: data.organization.currency,
                            taxEnabled: data.organization.settings?.taxEnabled ?? true,
                            vatRate: data.organization.settings?.vatRate ?? 18,
                            fiscalYearStart: data.organization.settings?.fiscalYearStart ?? '01-01',
                        })
                    }
                }
            } catch (error) {
                console.error('Failed to fetch organization:', error)
                toast.error('Failed to load settings')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrg()
    }, [getToken, reset])

    const onSubmit = async (data: SettingsFormData) => {
        setIsSaving(true)
        try {
            const token = await getToken()
            if (!token) return

            const payload = {
                name: data.name,
                industry: data.industry,
                country: data.country,
                currency: data.currency,
                settings: {
                    ...organization?.settings,
                    taxEnabled: data.taxEnabled,
                    vatRate: data.vatRate,
                    fiscalYearStart: data.fiscalYearStart,
                }
            }

            const method = organization ? 'PATCH' : 'POST'
            const url = organization
                ? `${process.env.NEXT_PUBLIC_API_URL}/organizations/me`
                : `${process.env.NEXT_PUBLIC_API_URL}/organizations`

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Business settings updated successfully')
                await refreshProfile()
                if (!organization) window.location.reload()
            } else {
                const errorData = await res.json()
                toast.error(errorData.error || 'Failed to update settings')
            }
        } catch (error) {
            console.error('Update error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure your organization profile and regional preferences.</p>
            </div>

            {!organization && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Organization Setup Required</h3>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            You've skipped the initial setup. Please provide your business details below to enable all features like POS and Inventory management.
                        </p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="finance">Finance & Tax</TabsTrigger>
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    General Information
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Business Name</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="e.g. Acme Retail Solutions"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select
                                        onValueChange={(value) => setValue('industry', value as any)}
                                        defaultValue={organization?.industry}
                                    >
                                        <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select Industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RETAIL">Retail</SelectItem>
                                            <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                                            <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                                            <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                                            <SelectItem value="EDUCATION">Education</SelectItem>
                                            <SelectItem value="NGO">NGO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.industry && <p className="text-xs text-red-500">{errors.industry.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-green-600" />
                                    Localization & Currency
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country (2rd Code)</Label>
                                    <Input
                                        id="country"
                                        {...register('country')}
                                        placeholder="e.g. TZ"
                                        maxLength={2}
                                        className={errors.country ? 'border-red-500' : ''}
                                    />
                                    <p className="text-[10px] text-gray-400">ISO 3166-1 alpha-2 code</p>
                                    {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency Code</Label>
                                    <Input
                                        id="currency"
                                        {...register('currency')}
                                        placeholder="e.g. TZS"
                                        maxLength={3}
                                        className={errors.currency ? 'border-red-500' : ''}
                                    />
                                    <p className="text-[10px] text-gray-400">ISO 4217 standard code</p>
                                    {errors.currency && <p className="text-xs text-red-500">{errors.currency.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm">Changes will take effect immediately across all users.</span>
                            </div>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-lg font-bold shadow-lg shadow-blue-500/20"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Business Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="finance">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-amber-600" />
                                    Taxation Settings
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Enable Taxation</Label>
                                        <p className="text-xs text-muted-foreground">Calculate tax on sales and purchases</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...register('taxEnabled')}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="vatRate">Default VAT/GST Rate (%)</Label>
                                        <Input
                                            id="vatRate"
                                            type="number"
                                            {...register('vatRate', { valueAsNumber: true })}
                                            placeholder="e.g. 18"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fiscalYearStart">Fiscal Year Start (MM-DD)</Label>
                                        <Input
                                            id="fiscalYearStart"
                                            {...register('fiscalYearStart')}
                                            placeholder="e.g. 01-01"
                                        />
                                        <p className="text-[10px] text-gray-400">Month and Day your business year begins</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Accounting Periods
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="p-4 border rounded-lg flex items-center justify-between">
                                        <div>
                                            <div className="font-bold">2024 Fiscal Year</div>
                                            <div className="text-xs text-green-600">Open</div>
                                        </div>
                                        <Button variant="outline" size="sm" disabled>Current</Button>
                                    </div>
                                    <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 opacity-60">
                                        <div>
                                            <div className="font-bold">2023 Fiscal Year</div>
                                            <div className="text-xs text-gray-500">Closed</div>
                                        </div>
                                        <Button variant="ghost" size="sm">View Reports</Button>
                                    </div>
                                    <Button variant="outline" className="w-full border-dashed">
                                        <Plus className="mr-2 h-4 w-4" /> Add New Accounting Period
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600"
                            >
                                {isSaving ? 'Saving...' : 'Save Financial Settings'}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="locations">
                    <LocationsTab />
                </TabsContent>

                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
