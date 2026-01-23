'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const INDUSTRIES = [
    { value: 'RETAIL', label: 'Retail' },
    { value: 'WHOLESALE', label: 'Wholesale' },
    { value: 'HEALTHCARE', label: 'to Healthcare' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'NGO', label: 'NGO / Non-Profit' },
    { value: 'MANUFACTURING', label: 'Manufacturing' },
]

export default function OnboardingPage() {
    const { user, refreshProfile } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        industry: 'RETAIL',
        country: 'TZ', // Default to Tanzania
        currency: 'TZS', // Default to Tanzanian Shilling
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = (await import('@/lib/supabase/client')).createClient().auth.getSession().then(s => s.data.session?.access_token);
            const resolvedToken = await token;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resolvedToken}`,
                },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create organization')
            }

            // Organization created successfully!
            // Refresh profile to get the new organizationId
            await refreshProfile()

            // Redirect to dashboard
            router.push('/dashboard')

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
                    Setup your Organization
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Tell us about your business to get started
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                                    required
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
                                    required
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
                                        required
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
                                        required
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
                                {loading ? 'Creating Organization...' : 'Get Started'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    sessionStorage.setItem('skipOnboarding', 'true')
                                    router.push('/dashboard')
                                }}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
