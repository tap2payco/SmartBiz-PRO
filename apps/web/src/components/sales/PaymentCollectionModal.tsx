import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Banknote, CreditCard, Loader2 } from 'lucide-react'

interface PaymentCollectionModalProps {
    isOpen: boolean
    onClose: () => void
    sale: any
    onPaymentComplete: () => void
}

export function PaymentCollectionModal({ isOpen, onClose, sale, onPaymentComplete }: PaymentCollectionModalProps) {
    const { getToken } = useAuth()
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER'>('CASH')
    const [accountId, setAccountId] = useState('')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])

    const balanceDue = sale ? Number(sale.totalAmount) - Number(sale.paidAmount) : 0

    useEffect(() => {
        if (isOpen && sale) {
            setAmount(balanceDue.toString())
            setMethod('CASH')
            fetchAccounts()
        }
    }, [isOpen, sale])

    const fetchAccounts = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banking/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
                // Default to first cash account
                const cash = data.find((a: any) => a.type === 'CASH')
                if (cash) setAccountId(cash.id)
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error)
        }
    }

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        if (Number(amount) > balanceDue) {
            toast.error('Amount exceeds balance due')
            return
        }

        if (!accountId) {
            toast.error('Please select a deposit account')
            return
        }

        setIsSubmitting(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${sale.id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    method,
                    accountId,
                    reference,
                    notes
                })
            })

            if (res.ok) {
                toast.success('Payment recorded successfully')
                onPaymentComplete()
                onClose()
            } else {
                const error = await res.json()
                toast.error(error.message || 'Failed to record payment')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!sale) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Collect Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for Invoice #{sale.saleNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex justify-between items-center text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Balance Due</span>
                        <span className="text-xl font-bold">TZS {balanceDue.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount Received</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            max={balanceDue}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={method === 'CASH' ? 'default' : 'outline'}
                            onClick={() => setMethod('CASH')}
                            className="flex gap-2"
                            type="button"
                        >
                            <Banknote className="h-4 w-4" /> Cash
                        </Button>
                        <Button
                            variant={method === 'MOBILE_MONEY' ? 'default' : 'outline'}
                            onClick={() => setMethod('MOBILE_MONEY')}
                            className="flex gap-2"
                            type="button"
                        >
                            <CreditCard className="h-4 w-4" /> Mobile
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Deposit Account</Label>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Reference / Notes (Optional)</Label>
                        <Input
                            placeholder="e.g. Receipt #1234"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
