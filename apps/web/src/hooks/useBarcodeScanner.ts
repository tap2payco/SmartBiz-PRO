import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeThreshold?: number; // Time between keystrokes to consider it part of a scan
    prefix?: string; // Optional prefix to trigger scan (e.g. if configured on scanner)
    targetRef?: React.RefObject<HTMLElement>; // Optional target element to listen on (default window)
}

export const useBarcodeScanner = ({
    onScan,
    minLength = 3,
    timeThreshold = 50,
    prefix,
    targetRef
}: BarcodeScannerOptions) => {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const char = e.key;

            // Ignore special keys except Enter
            if (char.length > 1 && char !== 'Enter') return;

            // If too much time passed, reset buffer
            if (now - lastKeyTime.current > timeThreshold) {
                buffer.current = '';
            }

            lastKeyTime.current = now;

            if (char === 'Enter') {
                if (buffer.current.length >= minLength) {
                    const scannedCode = buffer.current;
                    // If prefix is required, check for it
                    if (prefix) {
                        if (scannedCode.startsWith(prefix)) {
                            onScan(scannedCode.slice(prefix.length));
                        }
                    } else {
                        onScan(scannedCode);
                    }
                    buffer.current = '';
                }
            } else {
                buffer.current += char;
            }

            // Clear buffer if it sits too long without Enter (prevents random typing from matching)
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                buffer.current = '';
            }, timeThreshold * 2);
        };

        const target = targetRef?.current || window;

        // We use 'keydown' because it's standard.
        // Some scanners emulate 'keypress' which is deprecated.
        target.addEventListener('keydown', handleKeyDown as EventListener);

        return () => {
            target.removeEventListener('keydown', handleKeyDown as EventListener);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [onScan, minLength, timeThreshold, prefix, targetRef]);
};
