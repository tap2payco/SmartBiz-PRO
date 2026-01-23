'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

interface PrintLabelsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    items: Array<{
        id: string
        name: string
        sku: string
        barcode?: string
        sellingPrice: number
    }>
}

export function PrintLabelsDialog({
    open,
    onOpenChange,
    items
}: PrintLabelsDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>('barcode')
    const [options, setOptions] = useState({
        showName: true,
        showPrice: true,
        showSku: false,
    })

    const handleGeneratePDF = async () => {
        if (items.length === 0) {
            toast.error('No items selected')
            return
        }

        setIsGenerating(true)

        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank', 'width=900,height=700')
            if (!printWindow) {
                toast.error('Please allow popups to generate labels')
                setIsGenerating(false)
                return
            }

            // Generate code images for each item
            const codeData: { [key: string]: string } = {}

            for (const item of items) {
                const codeValue = item.barcode || item.sku || item.id.slice(0, 12)

                try {
                    if (codeType === 'qrcode') {
                        // Generate QR code as data URL
                        const qrDataUrl = await QRCode.toDataURL(codeValue, {
                            width: 80,
                            margin: 1,
                            color: { dark: '#000000', light: '#ffffff' }
                        })
                        codeData[item.id] = `<img src="${qrDataUrl}" alt="${codeValue}" style="width:60px;height:60px;" />`
                    } else {
                        // Generate barcode as SVG
                        const canvas = document.createElement('canvas')
                        JsBarcode(canvas, codeValue, {
                            format: 'CODE128',
                            width: 1.2,
                            height: 35,
                            displayValue: true,
                            fontSize: 10,
                            margin: 2,
                            background: '#ffffff'
                        })
                        codeData[item.id] = `<img src="${canvas.toDataURL('image/png')}" alt="${codeValue}" style="max-width:100%;height:auto;" />`
                    }
                } catch (e) {
                    console.error('Code generation error for', codeValue, e)
                    // Fallback: just show the text
                    codeData[item.id] = `<div style="padding:5px;border:1px solid #999;font-family:monospace;font-size:10px;">${codeValue}</div>`
                }
            }

            // Build the HTML content
            const labelsHtml = items.map(item => `
                <div class="label">
                    <div class="code">${codeData[item.id]}</div>
                    ${options.showName ? `<div class="name">${item.name.length > 22 ? item.name.slice(0, 20) + '...' : item.name}</div>` : ''}
                    ${options.showPrice ? `<div class="price">TZS ${Number(item.sellingPrice).toLocaleString()}</div>` : ''}
                    ${options.showSku ? `<div class="sku">${item.sku}</div>` : ''}
                </div>
            `).join('')

            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SmartBiz Labels - ${new Date().toLocaleDateString()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 8mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .container {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 1.5mm;
            padding: 2mm;
        }
        
        .label {
            border: 0.5px dashed #aaa;
            padding: 2mm;
            text-align: center;
            page-break-inside: avoid;
            background: white;
            min-height: ${codeType === 'qrcode' ? '38mm' : '42mm'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .code {
            margin-bottom: 1mm;
        }
        
        .code img {
            max-width: 100%;
            height: auto;
        }
        
        .name {
            font-size: 7pt;
            font-weight: bold;
            margin-top: 1mm;
            word-wrap: break-word;
            max-width: 100%;
            line-height: 1.2;
        }
        
        .price {
            font-size: 8pt;
            font-weight: bold;
            color: #000;
            margin-top: 0.5mm;
        }
        
        .sku {
            font-size: 6pt;
            color: #666;
            margin-top: 0.5mm;
            font-family: monospace;
        }
        
        .header {
            text-align: center;
            padding: 8px;
            border-bottom: 1px solid #ddd;
            margin-bottom: 8px;
            background: #f8f9fa;
        }
        
        .header h1 {
            font-size: 16pt;
            color: #1a1a1a;
            margin-bottom: 4px;
        }
        
        .header p {
            font-size: 10pt;
            color: #666;
        }
        
        .actions {
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            z-index: 1000;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn-primary {
            background: #2563eb;
            color: white;
        }
        
        .btn-primary:hover {
            background: #1d4ed8;
        }
        
        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
        
        .btn-secondary:hover {
            background: #d1d5db;
        }
        
        @media print {
            .actions, .header {
                display: none !important;
            }
            .container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button class="btn btn-primary" onclick="window.print()">
            🖨️ Print / Save as PDF
        </button>
        <button class="btn btn-secondary" onclick="window.close()">
            ✕ Close
        </button>
    </div>
    
    <div class="header">
        <h1>📦 SmartBiz Pro - Product Labels</h1>
        <p>${items.length} label${items.length !== 1 ? 's' : ''} • ${codeType === 'qrcode' ? 'QR Codes' : 'Barcodes'} • ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="container">
        ${labelsHtml}
    </div>
</body>
</html>
            `

            printWindow.document.write(html)
            printWindow.document.close()

            toast.success(`Labels ready! Click "Print / Save as PDF" in the new window`)
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to generate labels:', error)
            toast.error('Failed to generate labels. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Print Product Labels
                    </DialogTitle>
                    <DialogDescription>
                        Generate {items.length} label{items.length !== 1 ? 's' : ''} for printing (25 per A4 page).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Selected Items Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Selected Items:</p>
                        <div className="space-y-1">
                            {items.slice(0, 4).map(item => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="truncate flex-1 mr-2">{item.name}</span>
                                    <span className="text-gray-500 font-mono text-xs">{item.barcode || item.sku}</span>
                                </div>
                            ))}
                            {items.length > 4 && (
                                <p className="text-xs text-gray-400 italic">...and {items.length - 4} more</p>
                            )}
                        </div>
                    </div>

                    {/* Code Type Selection */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Code Type:</p>
                        <RadioGroup
                            value={codeType}
                            onValueChange={(v) => setCodeType(v as 'barcode' | 'qrcode')}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="barcode" id="barcode" />
                                <Label htmlFor="barcode" className="text-sm cursor-pointer">
                                    📊 Barcode (CODE128)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="qrcode" id="qrcode" />
                                <Label htmlFor="qrcode" className="text-sm cursor-pointer">
                                    📱 QR Code
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Label Options */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Include on label:</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showName"
                                    checked={options.showName}
                                    onCheckedChange={(checked) => setOptions(o => ({ ...o, showName: !!checked }))}
                                />
                                <Label htmlFor="showName" className="text-sm cursor-pointer">Name</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showPrice"
                                    checked={options.showPrice}
                                    onCheckedChange={(checked) => setOptions(o => ({ ...o, showPrice: !!checked }))}
                                />
                                <Label htmlFor="showPrice" className="text-sm cursor-pointer">Price</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showSku"
                                    checked={options.showSku}
                                    onCheckedChange={(checked) => setOptions(o => ({ ...o, showSku: !!checked }))}
                                />
                                <Label htmlFor="showSku" className="text-sm cursor-pointer">SKU</Label>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            💡 A preview window will open. Use <strong>"Save as PDF"</strong> in the print dialog to download, or print directly to your printer.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGeneratePDF}
                        disabled={isGenerating || items.length === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isGenerating ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Printer className="h-4 w-4 mr-2" />
                                Generate Labels
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
