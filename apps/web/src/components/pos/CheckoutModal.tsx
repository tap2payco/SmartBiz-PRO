import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { toast } from 'sonner'
import { Banknote, CreditCard, AlertCircle } from 'lucide-react'

interface Account {
    id: string
    name: string
    currency: string
    type: string
}

interface Customer {
    id: string
    name: string
    creditLimit?: number | string | null
    outstandingDebt?: number
    availableCredit?: number
}

interface CheckoutModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    totalAmount: number
    cartItemCount: number
    onComplete: (payment: {
        amount: number
        method: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'
        accountId?: string
        reference?: string
        notes?: string
    }) => Promise<void>
    accounts: Account[]
    selectedCustomer?: Customer | null
}

export function CheckoutModal({
    open,
    onOpenChange,
    totalAmount,
    cartItemCount,
    onComplete,
    accounts,
    selectedCustomer
}: CheckoutModalProps) {
    const [step, setStep] = useState<'REVIEW' | 'PAYMENT'>('PAYMENT')
    const [amountPaying, setAmountPaying] = useState<string>(totalAmount.toString())
    const [method, setMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT'>('CASH')
    const [accountId, setAccountId] = useState<string>('')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reset when opening
    useEffect(() => {
        if (open) {
            setAmountPaying(totalAmount.toString())
            setMethod('CASH')
            // Default to first CASH account
            const cashAccount = accounts.find(a => a.type === 'CASH')
            if (cashAccount) setAccountId(cashAccount.id)
        }
    }, [open, totalAmount, accounts])

    const numericAmount = parseFloat(amountPaying) || 0
    const balanceDue = totalAmount - numericAmount
    const isCreditSale = balanceDue > 0

    const creditLimit = selectedCustomer?.creditLimit ? Number(selectedCustomer.creditLimit) : 0
    const availableCredit = selectedCustomer?.availableCredit || 0 // This should be fetched fresh ideally

    // Quick validation
    const canDoCredit = selectedCustomer && isCreditSale
    const isLimitExceeded = isCreditSale && (balanceDue > availableCredit) && creditLimit > 0

    const handleSubmit = async () => {
        if (!accountId && method !== 'CREDIT' && numericAmount > 0) {
            toast.error('Please select a deposit account')
            return
        }

        if (isCreditSale && !selectedCustomer) {
            toast.error('Customer is required for credit sales')
            return
        }

        if (isLimitExceeded) {
            toast.error('Credit limit exceeded')
            return
        }

        setIsSubmitting(true)
        try {
            await onComplete({
                amount: numericAmount,
                method,
                accountId: numericAmount > 0 ? accountId : undefined,
                reference,
                notes
            })
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Complete Transaction</DialogTitle>
                    <DialogDescription>
                        Total Due: <span className="font-bold text-primary">TZS {totalAmount.toLocaleString()}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Amount Paying Input */}
                    <div className="space-y-2">
                        <Label>Amount Paying Now</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">TZS</span>
                            <Input
                                type="number"
                                className="pl-12 text-lg font-bold"
                                value={amountPaying}
                                onChange={(e) => setAmountPaying(e.target.value)}
                                max={totalAmount}
                                min={0}
                            />
                        </div>
                    </div>

                    {/* Balance / Credit Warning */}
                    {isCreditSale && (
                        <div className={`p-3 rounded-lg border ${!selectedCustomer ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            <div className="flex justify-between font-bold mb-1">
                                <span>Balance (Credit):</span>
                                <span>TZS {balanceDue.toLocaleString()}</span>
                            </div>

                            {!selectedCustomer ? (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Please select a customer to enable credit.</span>
                                </div>
                            ) : (
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span>Customer:</span>
                                        <span className="font-semibold">{selectedCustomer.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Credit Limit:</span>
                                        <span>{creditLimit > 0 ? `TZS ${creditLimit.toLocaleString()}` : 'Unlimited'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Available:</span>
                                        <span className={isLimitExceeded ? 'text-red-600 font-bold' : 'text-green-600'}>
                                            {availableCredit > 0 ? `TZS ${availableCredit.toLocaleString()}` : (creditLimit > 0 ? '0' : 'N/A')}
                                        </span>
                                    </div>
                                    {isLimitExceeded && (
                                        <div className="text-red-600 font-bold text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Credit Limit Exceeded
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Method - Only show if paying > 0 */}
                    {numericAmount > 0 && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={method === 'CASH' ? 'default' : 'outline'}
                                    className="flex gap-2"
                                    onClick={() => setMethod('CASH')}
                                >
                                    <Banknote className="h-4 w-4" /> Cash
                                </Button>
                                <Button
                                    variant={method === 'MOBILE_MONEY' ? 'default' : 'outline'}
                                    className="flex gap-2"
                                    onClick={() => setMethod('MOBILE_MONEY')}
                                >
                                    <CreditCard className="h-4 w-4" /> Mobile
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Select Account</Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Account" />
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
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (isCreditSale && !selectedCustomer) || isLimitExceeded}
                        className={isCreditSale ? 'bg-amber-600 hover:bg-amber-700' : ''}
                    >
                        {isSubmitting ? 'Processing...' : (
                            isCreditSale ? `Confirm Credit Sale` : `Pay TZS ${totalAmount.toLocaleString()}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
