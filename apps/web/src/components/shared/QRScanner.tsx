'use client'

import { useState } from 'react'
import { useZxing } from 'react-zxing'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Camera, RefreshCw } from 'lucide-react'

interface QRScannerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onScan: (result: string) => void
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null)

    const { ref } = useZxing({
        onDecodeResult(result) {
            onScan(result.getText())
            onOpenChange(false)
        },
        onError(err) {
            console.error('ZXing Error:', err)
            // Silently ignore camera initialization errors if already busy
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        Scan QR Code
                    </DialogTitle>
                    <DialogDescription>
                        Point your camera at the SmartBiz QR code on the receipt or invoice.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border-4 border-gray-100 shadow-inner">
                    <video ref={ref as any} className="h-full w-full object-cover" />

                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white rounded-br" />

                            {/* Scanning line animation */}
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 opacity-50 animate-[scan_2s_linear_infinite]"
                                style={{
                                    animation: 'move-line 2s linear infinite'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes move-line {
                        0% { top: 0; }
                        50% { top: 100%; }
                        100% { top: 0; }
                    }
                `}</style>

                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex gap-2">
                        <X className="h-4 w-4" /> Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
