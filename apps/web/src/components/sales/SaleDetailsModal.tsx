'use client'

import { ReturnDialog } from "@/components/returns/ReturnDialog"
import { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Package, User, CreditCard, Banknote, Calendar, Receipt, Printer, RotateCcw } from "lucide-react"

interface SaleDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    sale: any
}


export function SaleDetailsModal({ isOpen, onClose, sale }: SaleDetailsModalProps) {
    const [isReturnOpen, setIsReturnOpen] = useState(false)

    if (!sale) return null

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl overflow-hidden">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-8">
                            {/* ... Title section remains ... */}
                            <div>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-blue-600" />
                                    Sale Details: {sale.saleNumber}
                                </DialogTitle>
                                <DialogDescription>
                                    {format(new Date(sale.createdAt), 'MMMM dd, yyyy HH:mm')}
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={sale.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                                    className={
                                        sale.paymentStatus === 'PAID'
                                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                    }
                                >
                                    {sale.paymentStatus}
                                </Badge>
                                {sale.status === 'RETURNED' && (
                                    <Badge variant="destructive">RETURNED</Badge>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Actions Toolbar */}
                    <div className="flex justify-end gap-2 px-1">
                        {sale.status !== 'RETURNED' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                onClick={() => setIsReturnOpen(true)}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Return Items
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                const QRCode = (await import('qrcode')).default
                                const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify({
                                    type: 'SMARTBIZ_SALE',
                                    id: sale.id,
                                    number: sale.saleNumber,
                                    total: sale.totalAmount
                                }))

                                const printWindow = window.open('', '_blank')
                                if (printWindow) {
                                    printWindow.document.write(`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <title>Invoice - ${sale.saleNumber}</title>
                                            <style>
                                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                                body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
                                                .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
                                                .qr-section { text-align: right; }
                                                .qr-code { width: 100px; height: 100px; margin-bottom: 5px; }
                                                .qr-label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
                                                .bill-to { margin-bottom: 30px; }
                                                .items-table { w-full border-collapse: collapse; margin-bottom: 30px; }
                                                .items-table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
                                                .items-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                                                .totals { margin-left: auto; width: 250px; }
                                                .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                                                .grand-total { font-size: 18px; font-weight: 700; color: #2563eb; border-top: 2px solid #e5e7eb; margin-top: 10px; padding-top: 10px; }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="header">
                                                <div>
                                                    <h1 style="font-size: 24px; color: #2563eb; margin-bottom: 5px;">SmartBiz PRO</h1>
                                                    <p style="color: #6b7280; font-size: 14px;">Official Receipt / Invoice</p>
                                                    <p style="font-weight: 600; font-size: 16px; margin-top: 15px;"># ${sale.saleNumber}</p>
                                                    <p style="font-size: 12px; color: #9ca3af;">${format(new Date(sale.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                                                </div>
                                                <div class="qr-section">
                                                    <img src="${qrCodeDataUrl}" class="qr-code" />
                                                    <div class="qr-label">Scan to Verify</div>
                                                </div>
                                            </div>

                                            <div class="bill-to">
                                                <h3 style="font-size: 10px; color: #9ca3af; text-transform: uppercase; margin-bottom: 10px;">Bill To:</h3>
                                                <p style="font-weight: 600;">${sale.customer?.name || 'Walk-in Customer'}</p>
                                                ${sale.customer?.phone ? `<p style="font-size: 14px; color: #4b5563;">${sale.customer.phone}</p>` : ''}
                                            </div>

                                            <table class="items-table" style="width: 100%; border-collapse: collapse;">
                                                <thead>
                                                    <tr>
                                                        <th>Description</th>
                                                        <th style="text-align: right;">Unit Price</th>
                                                        <th style="text-align: center;">Qty</th>
                                                        <th style="text-align: right;">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${sale.items?.map((item: any) => `
                                                        <tr>
                                                            <td style="font-weight: 500;">${item.item?.name || 'Item'}</td>
                                                            <td style="text-align: right;">${Number(item.unitPrice).toLocaleString()}</td>
                                                            <td style="text-align: center;">${Number(item.quantity)}</td>
                                                            <td style="text-align: right; font-weight: 600;">${Number(item.total).toLocaleString()}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>

                                            <div class="totals">
                                                <div class="total-row">
                                                    <span>Subtotal</span>
                                                    <span>${Number(sale.subtotal).toLocaleString()}</span>
                                                </div>
                                                ${Number(sale.taxTotal) > 0 ? `
                                                    <div class="total-row">
                                                        <span>Tax</span>
                                                        <span>${Number(sale.taxTotal).toLocaleString()}</span>
                                                    </div>
                                                ` : ''}
                                                <div class="total-row grand-total">
                                                    <span>Amount Due</span>
                                                    <span>TZS ${Number(sale.totalAmount).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div style="margin-top: 60px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                                                <p style="font-size: 14px; font-weight: 600; color: #4b5563;">Thank you for your business!</p>
                                                <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">Powered by SmartBiz Software</p>
                                            </div>
                                        </body>
                                        </html>
                                    `)
                                    printWindow.document.close()
                                    printWindow.print()
                                }
                            }}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                        </Button>
                    </div>

                    {/* ... Rest of content ... */}

                    <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                        {/* ... existing content ... */}
                        {/* Customer & Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ... existing ... */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    Customer
                                </h3>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {sale.customer?.name || 'Walk-in Customer'}
                                </p>
                                {sale.customer?.phone && (
                                    <p className="text-sm text-gray-500 mt-1">{sale.customer.phone}</p>
                                )}
                            </div>
                            {/* ... existing ... */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" />
                                    Payment Method
                                </h3>
                                <div className="flex items-center gap-2">
                                    {sale.payments?.[0]?.method === 'CASH' ? <Banknote className="h-4 w-4 text-green-600" /> : <CreditCard className="h-4 w-4 text-blue-600" />}
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {sale.payments?.[0]?.method || 'UNSET'}
                                    </span>
                                </div>
                                {sale.payments?.[0]?.reference && (
                                    <p className="text-xs text-gray-500 mt-1">Ref: {sale.payments[0].reference}</p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Package className="h-3 w-3" />
                                Items Summary
                            </h3>
                            {/* ... table ... */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Item</th>
                                            <th className="px-4 py-3 font-semibold text-right">Price</th>
                                            <th className="px-4 py-3 font-semibold text-center">Qty</th>
                                            <th className="px-4 py-3 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                        {sale.items?.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {item.item?.name || 'Unknown Item'}
                                                    <p className="text-[10px] text-gray-400 font-normal">{item.item?.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {Number(item.unitPrice).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {Number(item.quantity)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {Number(item.total).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-2">
                            <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                                <span>Subtotal</span>
                                <span>TZS {Number(sale.subtotal).toLocaleString()}</span>
                            </div>
                            {Number(sale.taxTotal) > 0 && (
                                <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                                    <span>Tax</span>
                                    <span>TZS {Number(sale.taxTotal).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-blue-700 dark:text-blue-200 pt-2 border-t border-blue-100 dark:border-blue-900/50">
                                <span>Grand Total</span>
                                <span>TZS {Number(sale.totalAmount).toLocaleString()}</span>
                            </div>
                        </div>

                        {sale.notes && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{sale.notes}"</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ReturnDialog
                isOpen={isReturnOpen}
                onClose={() => setIsReturnOpen(false)}
                sale={sale}
                onSuccess={() => {
                    toast.success("Return processed")
                    onClose() // Close the details modal to refresh data on parent
                }}
            />
        </>
    )
}
