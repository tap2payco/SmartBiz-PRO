/**
 * Generate a UUID v4
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Generate an idempotency key for sync operations
 */
export function generateIdempotencyKey(
    organizationId: string,
    deviceId: string,
    timestamp: number
): string {
    return `${organizationId}:${deviceId}:${timestamp}:${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'TZS'): string {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency,
    }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (format === 'long') {
        return new Intl.DateTimeFormat('en-TZ', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(d);
    }

    return new Intl.DateTimeFormat('en-TZ', {
        dateStyle: 'short',
    }).format(d);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
    } = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxAttempts - 1) {
                const delay = Math.min(
                    initialDelay * Math.pow(backoffFactor, attempt),
                    maxDelay
                );
                await sleep(delay);
            }
        }
    }

    throw lastError!;
}

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

/**
 * Check if online
 */
export function isOnline(): boolean {
    if (!isBrowser()) return true;
    return navigator.onLine;
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
}


/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Check if user has permission
 */
import { ROLE_PERMISSIONS, USER_ROLES } from '../constants';

export function hasPermission(
    role: string,
    userPermissions: string[] | null | undefined,
    requiredPermission: string
): boolean {
    // Admin and Owner have all permissions
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.OWNER) return true;

    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    if (rolePerms.includes(requiredPermission)) return true;

    // Check custom user permissions
    if (userPermissions && userPermissions.includes(requiredPermission)) return true;

    return false;
}
