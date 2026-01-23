'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Printer, X } from 'lucide-react'

interface InvoiceProps {
    sale: any
    organization?: any
    onClose: () => void
}

export function Invoice({ sale, organization, onClose }: InvoiceProps) {
    const invoiceRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        const printContent = invoiceRef.current
        if (!printContent) return

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
                    .meta-section h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
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
                ${printContent.innerHTML}
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
    }

    if (!sale) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <h2 className="font-bold text-lg">Invoice Preview</h2>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="flex-1 overflow-auto p-8 bg-white">
                    <div ref={invoiceRef}>
                        {/* Header */}
                        <div className="header">
                            <h1>{organization?.name || 'SmartBiz Pro'}</h1>
                            <p>{organization?.address || 'Your Business Address'}</p>
                            <p>{organization?.phone || ''} {organization?.email ? `| ${organization.email}` : ''}</p>
                        </div>

                        {/* Invoice Meta */}
                        <div className="meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <div className="meta-section">
                                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Invoice To</h3>
                                <p style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>{sale.customer?.name || 'Walk-in Customer'}</strong><br />
                                    {sale.customer?.phone && <>{sale.customer.phone}<br /></>}
                                    {sale.customer?.address && <>{sale.customer.address}</>}
                                </p>
                            </div>
                            <div className="meta-section" style={{ textAlign: 'right' }}>
                                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Invoice Details</h3>
                                <p style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>Invoice #:</strong> {sale.saleNumber}<br />
                                    <strong>Date:</strong> {format(new Date(sale.createdAt), 'MMMM dd, yyyy')}<br />
                                    <strong>Status:</strong> {sale.paymentStatus}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="text-right">Unit Price</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items?.map((item: any, index: number) => (
                                    <tr key={item.id || index}>
                                        <td>
                                            <strong>{item.item?.name || 'Item'}</strong>
                                            {item.item?.sku && <span style={{ color: '#6b7280', fontSize: '12px', display: 'block' }}>{item.item.sku}</span>}
                                        </td>
                                        <td className="text-right">TZS {Number(item.unitPrice).toLocaleString()}</td>
                                        <td className="text-center">{Number(item.quantity)}</td>
                                        <td className="text-right">TZS {Number(item.total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="totals" style={{ marginLeft: 'auto', width: '280px' }}>
                            <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span>Subtotal</span>
                                <span>TZS {Number(sale.subtotal).toLocaleString()}</span>
                            </div>
                            {Number(sale.taxTotal) > 0 && (
                                <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span>Tax</span>
                                    <span>TZS {Number(sale.taxTotal).toLocaleString()}</span>
                                </div>
                            )}
                            {Number(sale.discountTotal) > 0 && (
                                <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span>Discount</span>
                                    <span>-TZS {Number(sale.discountTotal).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="totals-row grand" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 'bold', color: '#1e40af', borderTop: '2px solid #2563eb', marginTop: '8px' }}>
                                <span>Total</span>
                                <span>TZS {Number(sale.totalAmount).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        {sale.payments?.[0] && (
                            <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <p style={{ color: '#166534', fontWeight: '500' }}>
                                    ✓ Payment received via {sale.payments[0].method}
                                    {sale.payments[0].reference && <span> (Ref: {sale.payments[0].reference})</span>}
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="footer" style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px' }}>
                            <p>Thank you for your business!</p>
                            <p style={{ marginTop: '5px' }}>Generated by SmartBiz Pro ERP</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
