'use client'

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
import { Package, User, CreditCard, Banknote, Calendar, Receipt, Printer } from "lucide-react"

interface SaleDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    sale: any
}

export function SaleDetailsModal({ isOpen, onClose, sale }: SaleDetailsModalProps) {
    if (!sale) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-blue-600" />
                                Sale Details: {sale.saleNumber}
                            </DialogTitle>
                            <DialogDescription>
                                {format(new Date(sale.createdAt), 'MMMM dd, yyyy HH:mm')}
                            </DialogDescription>
                        </div>
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
                    </div>
                </DialogHeader>

                {/* Print Button */}
                <div className="flex justify-end px-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const printWindow = window.open('', '_blank')
                            if (!printWindow) return

                            printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>Invoice - ${sale.saleNumber}</title>
                                    <style>
                                        * { margin: 0; padding: 0; box-sizing: border-box; }
                                        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                                        .header h1 { font-size: 28px; color: #1e40af; margin-bottom: 5px; }
                                        .header p { color: #6b7280; font-size: 14px; }
                                        .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
                                        .meta-section h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
                                        .meta-section p { font-size: 14px; color: #111827; line-height: 1.6; }
                                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                                        th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
                                        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                                        .text-right { text-align: right; }
                                        .text-center { text-align: center; }
                                        .totals { margin-left: auto; width: 280px; }
                                        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                                        .totals-row.grand { font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 8px; }
                                        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
                                        @media print { body { padding: 20px; } }
                                    </style>
                                </head>
                                <body>
                                    <div class="header">
                                        <h1>SmartBiz Pro</h1>
                                        <p>Invoice</p>
                                    </div>
                                    <div class="meta">
                                        <div class="meta-section">
                                            <h3>Invoice To</h3>
                                            <p><strong>${sale.customer?.name || 'Walk-in Customer'}</strong></p>
                                        </div>
                                        <div class="meta-section" style="text-align: right;">
                                            <h3>Invoice Details</h3>
                                            <p>
                                                <strong>Invoice #:</strong> ${sale.saleNumber}<br/>
                                                <strong>Date:</strong> ${format(new Date(sale.createdAt), 'MMMM dd, yyyy')}<br/>
                                                <strong>Status:</strong> ${sale.paymentStatus}
                                            </p>
                                        </div>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th class="text-right">Unit Price</th>
                                                <th class="text-center">Qty</th>
                                                <th class="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${sale.items?.map((item: any) => `
                                                <tr>
                                                    <td><strong>${item.item?.name || 'Item'}</strong></td>
                                                    <td class="text-right">TZS ${Number(item.unitPrice).toLocaleString()}</td>
                                                    <td class="text-center">${Number(item.quantity)}</td>
                                                    <td class="text-right">TZS ${Number(item.total).toLocaleString()}</td>
                                                </tr>
                                            `).join('') || ''}
                                        </tbody>
                                    </table>
                                    <div class="totals">
                                        <div class="totals-row"><span>Subtotal</span><span>TZS ${Number(sale.subtotal).toLocaleString()}</span></div>
                                        <div class="totals-row grand"><span>Total</span><span>TZS ${Number(sale.totalAmount).toLocaleString()}</span></div>
                                    </div>
                                    <div class="footer">
                                        <p>Thank you for your business!</p>
                                        <p style="margin-top: 5px;">Generated by SmartBiz Pro ERP</p>
                                    </div>
                                </body>
                                </html>
                            `)
                            printWindow.document.close()
                            printWindow.focus()
                            printWindow.print()
                            printWindow.close()
                        }}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                    </Button>
                </div>

                <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Customer & Payment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    )
}
