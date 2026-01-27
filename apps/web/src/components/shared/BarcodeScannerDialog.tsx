'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useZxing } from 'react-zxing'
import { CameraOff } from 'lucide-react'

interface BarcodeScannerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onScan: (code: string) => void
}

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: BarcodeScannerDialogProps) {
    const { ref } = useZxing({
        onDecodeResult(result) {
            onScan(result.getText())
            onOpenChange(false)
        },
        paused: !open,
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Barcode</DialogTitle>
                    <DialogDescription>
                        Point your camera at a barcode to scan.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center aspect-video bg-black rounded-lg overflow-hidden relative">
                    {open ? (
                        <video ref={ref as any} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <CameraOff className="h-10 w-10" />
                            <span>Camera inactive</span>
                        </div>
                    )}

                    {/* Overlay guide */}
                    <div className="absolute inset-0 pointer-events-none border-[3px] border-white/40 rounded-lg m-12">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50"></div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
