'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/contexts/AuthContext"

interface SupplierSelectProps {
    value?: string
    onSelect: (supplier: any) => void
}

export function SupplierSelect({ value, onSelect }: SupplierSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [suppliers, setSuppliers] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const { getToken } = useAuth()

    React.useEffect(() => {
        if (open && suppliers.length === 0) {
            fetchSuppliers()
        }
    }, [open])

    const fetchSuppliers = async () => {
        setLoading(true)
        try {
            const token = await getToken()
            // Assume we can filter by type=SUPPLIER or just fetch all stakeholders
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                const items = data.stakeholders || data
                // Client side filter if API doesn't support specific endpoint yet
                // Assuming data is array of stakeholders
                const sups = Array.isArray(items) ? items.filter((s: any) => s.type === 'SUPPLIER') : []
                setSuppliers(sups)
            }
        } catch (error) {
            console.error('Failed to fetch suppliers', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedSupplier = suppliers.find((s) => s.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? selectedSupplier?.name
                        : "Select supplier..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search suppliers..." />
                    <CommandList>
                        <CommandEmpty>No supplier found.</CommandEmpty>
                        <CommandGroup>
                            {suppliers.map((supplier) => (
                                <CommandItem
                                    key={supplier.id}
                                    value={supplier.name}
                                    onSelect={() => {
                                        onSelect(supplier)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === supplier.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{supplier.name}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
