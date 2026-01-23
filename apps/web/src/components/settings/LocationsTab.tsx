'use client'

import { useState, useEffect } from 'react'
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationDialog } from './LocationDialog'
import { useAuth } from '@/contexts/AuthContext'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'

export function LocationsTab() {
    const { getToken } = useAuth()
    const [locations, setLocations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const fetchLocations = async () => {
        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setLocations(data)
            }
        } catch (error) {
            console.error('Failed to fetch locations:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLocations()
    }, [getToken])

    const handleDelete = async () => {
        if (!selectedLocation) return
        try {
            const token = await getToken()
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations/${selectedLocation.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success('Location deleted')
                fetchLocations()
            } else {
                toast.error('Failed to delete location')
            }
        } catch (error) {
            toast.error('Error deleting location')
        } finally {
            setIsDeleteDialogOpen(false)
            setSelectedLocation(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Locations</h3>
                    <p className="text-sm text-gray-500">Manage your stores and warehouses.</p>
                </div>
                <Button onClick={() => { setSelectedLocation(null); setIsDialogOpen(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((loc) => (
                    <Card key={loc.id} className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{loc.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                                                    {loc.type}
                                                </span>
                                            </div>
                                            {loc.address && (
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                    {loc.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500"
                                            onClick={() => { setSelectedLocation(loc); setIsDialogOpen(true) }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => { setSelectedLocation(loc); setIsDeleteDialogOpen(true) }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {locations.length === 0 && !isLoading && (
                    <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">No locations added</h3>
                        <p className="text-sm text-gray-500 mt-1">Add your first store or warehouse to get started.</p>
                    </div>
                )}
            </div>

            <LocationDialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setSelectedLocation(null)
                }}
                location={selectedLocation}
                onSuccess={fetchLocations}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Location"
                description={`Are you sure you want to delete "${selectedLocation?.name}"? Using locations cannot be fully deleted if they have history, they will be archived.`}
                onConfirm={handleDelete}
            />
        </div>
    )
}
