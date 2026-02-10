'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const INDUSTRIES = [
    { value: 'RETAIL', label: 'Retail' },
    { value: 'WHOLESALE', label: 'Wholesale' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'NGO', label: 'NGO / Non-Profit' },
    { value: 'MANUFACTURING', label: 'Manufacturing' },
]

export default function OnboardingPage() {
    const { user, profile, getToken, refreshProfile } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        industry: 'RETAIL',
        country: 'TZ',
        currency: 'TZS',
    })

    // Fetch current org data to pre-fill the form
    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const token = await getToken()
                if (!token) return

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data.organization) {
                        setFormData({
                            name: data.organization.name || '',
                            industry: data.organization.industry || 'RETAIL',
                            country: data.organization.country || 'TZ',
                            currency: data.organization.currency || 'TZS',
                        })
                    }
                }
            } catch (err) {
                console.error('Failed to fetch org:', err)
            } finally {
                setFetching(false)
            }
        }

        if (user) fetchOrg()
    }, [user, getToken])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = await getToken()

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update organization')
            }

            await refreshProfile()
            setSuccess(true)

            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)

        } catch (err: any) {
            console.error('Onboarding error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Customize Your Business
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Update your organization details or skip to start using the dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {success ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm text-center">
                            ✅ Organization updated! Redirecting to dashboard...
                        </div>
                    ) : fetching ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-3 text-sm text-gray-500">Loading your details...</p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Organization Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        placeholder="My Business Ltd"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Industry
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="industry"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                    >
                                        {INDUSTRIES.map((ind) => (
                                            <option key={ind.value} value={ind.value}>
                                                {ind.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Country
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="country"
                                            name="country"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        >
                                            <option value="TZ">Tanzania</option>
                                            <option value="KE">Kenya</option>
                                            <option value="UG">Uganda</option>
                                            <option value="RW">Rwanda</option>
                                            <option value="US">United States</option>
                                            <option value="GB">United Kingdom</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Currency
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="currency"
                                            name="currency"
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        >
                                            <option value="TZS">TZS</option>
                                            <option value="KES">KES</option>
                                            <option value="UGX">UGX</option>
                                            <option value="RWF">RWF</option>
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Saving...' : 'Save & Continue'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
