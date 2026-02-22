'use client'

import { TransactionDialog } from '../shared/TransactionDialog'
import { PaymentDialog } from '../shared/PaymentDialog'
import { ExpenseDialog } from '../shared/ExpenseDialog'
import { QRScanner } from '../shared/QRScanner'
import { toast } from 'sonner'

interface QuickActionDialogsProps {
    openInvoice: boolean
    setOpenInvoice: (open: boolean) => void
    openQuote: boolean
    setOpenQuote: (open: boolean) => void
    openPayment: boolean
    setOpenPayment: (open: boolean) => void
    openExpense: boolean
    setOpenExpense: (open: boolean) => void
    openScanner: boolean
    setOpenScanner: (open: boolean) => void
}

export function QuickActionDialogs({
    openInvoice, setOpenInvoice,
    openQuote, setOpenQuote,
    openPayment, setOpenPayment,
    openExpense, setOpenExpense,
    openScanner, setOpenScanner
}: QuickActionDialogsProps) {
    const handleGlobalScan = (data: string) => {
        try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'SMARTBIZ_SALE') {
                // If it's a sale, we usually want to record a payment
                setOpenPayment(true)
                // The PaymentDialog on web will handle auto-filling if we pass data, 
                // but since these are independent state items, 
                // let's just toast and the user can scan again inside the dialog if needed, 
                // OR we could pass the scanned data.
                // For now, opening the dialog is a good first step.
                toast.success(`Identified Sale #${parsed.number}. Opening Payment dialog...`)
            } else {
                toast.error('Unrecognized SmartBiz QR')
            }
        } catch (e) {
            toast.error('Invalid QR Format')
        }
    }
    return (
        <>
            <TransactionDialog
                type="INVOICE"
                open={openInvoice}
                onOpenChange={setOpenInvoice}
            />
            <TransactionDialog
                type="QUOTE"
                open={openQuote}
                onOpenChange={setOpenQuote}
            />
            <PaymentDialog
                open={openPayment}
                onOpenChange={setOpenPayment}
            />
            <ExpenseDialog
                open={openExpense}
                onOpenChange={setOpenExpense}
            />
            <QRScanner
                open={openScanner}
                onOpenChange={setOpenScanner}
                onScan={handleGlobalScan}
            />
        </>
    )
}
