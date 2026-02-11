'use client'

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

interface CustomerSelectProps {
    value?: string
    onSelect: (customer: any) => void
    error?: boolean
}

export function CustomerSelect({ value, onSelect, error }: CustomerSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [customers, setCustomers] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const { getToken } = useAuth()

    React.useEffect(() => {
        if (open && customers.length === 0) {
            fetchCustomers()
        }
    }, [open])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const token = await getToken()
            // Fetch stakeholders who are CUSTOMER type
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stakeholders?type=CUSTOMER`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCustomers(data)
            }
        } catch (error) {
            console.error('Failed to fetch customers', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedCustomer = customers.find((c) => c.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between",
                        !value && "text-muted-foreground",
                        error && "border-red-500"
                    )}
                >
                    {value
                        ? selectedCustomer?.name || "Customer selected"
                        : "Select customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                        onSelect(customer)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{customer.name}</span>
                                        {customer.phone && (
                                            <span className="text-xs text-gray-500">{customer.phone}</span>
                                        )}
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
