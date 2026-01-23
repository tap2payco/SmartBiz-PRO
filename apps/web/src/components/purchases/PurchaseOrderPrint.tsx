'use client'

import { formatCurrency } from '@/lib/utils'

interface PurchaseOrderPrintProps {
    order: any
    organization?: {
        name: string
        address?: string
        phone?: string
        email?: string
    }
}

export function printPurchaseOrder(order: any, organization?: any) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        alert('Please allow pop-ups to print the Purchase Order')
        return
    }

    const orgName = organization?.name || 'Your Company'
    const orgAddress = organization?.address || ''
    const orgPhone = organization?.phone || ''
    const orgEmail = organization?.email || ''

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Purchase Order - ${order.orderNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        .company-info h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 8px;
        }
        .company-info p {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
        }
        .po-badge {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-align: center;
        }
        .po-badge h2 {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        }
        .po-badge .po-number {
            font-size: 20px;
            font-weight: bold;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .detail-box {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .detail-box h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .detail-box p {
            font-size: 14px;
            line-height: 1.6;
        }
        .detail-box .name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background: #1e40af;
            color: white;
            padding: 12px 16px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        th:first-child { border-radius: 8px 0 0 0; }
        th:last-child { border-radius: 0 8px 0 0; text-align: right; }
        td {
            padding: 14px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        td:last-child { text-align: right; font-weight: 600; }
        tr:nth-child(even) { background: #f8fafc; }
        .item-name { font-weight: 500; }
        .item-sku { font-size: 11px; color: #64748b; }
        .totals {
            display: flex;
            justify-content: flex-end;
        }
        .totals-box {
            width: 280px;
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .totals-row.total {
            border-top: 2px solid #2563eb;
            margin-top: 8px;
            padding-top: 16px;
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
        }
        .notes {
            margin-top: 30px;
            padding: 16px;
            background: #fffbeb;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
        }
        .notes h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #92400e;
            margin-bottom: 8px;
        }
        .notes p {
            font-size: 13px;
            color: #78350f;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }
        .signature-area {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
        }
        .signature-box {
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #333;
            padding-top: 8px;
            margin-top: 50px;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>${orgName}</h1>
            <p>
                ${orgAddress ? orgAddress + '<br>' : ''}
                ${orgPhone ? 'Tel: ' + orgPhone + '<br>' : ''}
                ${orgEmail ? 'Email: ' + orgEmail : ''}
            </p>
        </div>
        <div class="po-badge">
            <h2>PURCHASE ORDER</h2>
            <div class="po-number">${order.orderNumber}</div>
        </div>
    </div>

    <div class="details-grid">
        <div class="detail-box">
            <h3>Supplier</h3>
            <p class="name">${order.supplier?.name || 'N/A'}</p>
            <p>
                ${order.supplier?.email ? order.supplier.email + '<br>' : ''}
                ${order.supplier?.phone || ''}
                ${order.supplier?.address ? '<br>' + order.supplier.address : ''}
            </p>
        </div>
        <div class="detail-box">
            <h3>Order Details</h3>
            <p>
                <strong>Issue Date:</strong> ${formatDate(order.issueDate || order.createdAt)}<br>
                ${order.expectedDeliveryDate ? '<strong>Expected:</strong> ' + formatDate(order.expectedDeliveryDate) + '<br>' : ''}
                <strong>Status:</strong> ${order.status}
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 50%">Item Description</th>
                <th style="width: 15%">Quantity</th>
                <th style="width: 15%">Unit Price</th>
                <th style="width: 20%">Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.lines?.map((line: any) => `
                <tr>
                    <td>
                        <div class="item-name">${line.item?.name || 'Item'}</div>
                        <div class="item-sku">SKU: ${line.item?.sku || '-'}</div>
                    </td>
                    <td>${line.quantity}</td>
                    <td>${Number(line.unitCost).toLocaleString('sw-TZ', { style: 'currency', currency: 'TZS' })}</td>
                    <td>${Number(line.totalCost).toLocaleString('sw-TZ', { style: 'currency', currency: 'TZS' })}</td>
                </tr>
            `).join('') || '<tr><td colspan="4">No items</td></tr>'}
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-box">
            <div class="totals-row">
                <span>Subtotal</span>
                <span>${Number(order.totalAmount).toLocaleString('sw-TZ', { style: 'currency', currency: 'TZS' })}</span>
            </div>
            <div class="totals-row">
                <span>Tax (0%)</span>
                <span>TSh 0</span>
            </div>
            <div class="totals-row total">
                <span>Grand Total</span>
                <span>${Number(order.totalAmount).toLocaleString('sw-TZ', { style: 'currency', currency: 'TZS' })}</span>
            </div>
        </div>
    </div>

    ${order.notes ? `
        <div class="notes">
            <h3>Notes / Instructions</h3>
            <p>${order.notes}</p>
        </div>
    ` : ''}

    <div class="signature-area">
        <div class="signature-box">
            <div class="signature-line">Authorized Signature (Buyer)</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Acknowledged (Supplier)</div>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated document. Generated on ${new Date().toLocaleString()}</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
}
