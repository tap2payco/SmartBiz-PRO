/**
 * Generate a UUID v4
 */
export function generateId() {
    return crypto.randomUUID();
}
/**
 * Generate an idempotency key for sync operations
 */
export function generateIdempotencyKey(organizationId, deviceId, timestamp) {
    return `${organizationId}:${deviceId}:${timestamp}:${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'TZS') {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency,
    }).format(amount);
}
/**
 * Format date
 */
export function formatDate(date, format = 'short') {
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
export function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
/**
 * Sleep/delay function
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
export async function retry(fn, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, backoffFactor = 2, } = options;
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxAttempts - 1) {
                const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
                await sleep(delay);
            }
        }
    }
    throw lastError;
}
/**
 * Check if code is running in browser
 */
export function isBrowser() {
    return typeof window !== 'undefined';
}
/**
 * Check if online
 */
export function isOnline() {
    if (!isBrowser())
        return true;
    return navigator.onLine;
}
/**
 * Truncate string
 */
export function truncate(str, length) {
    if (str.length <= length)
        return str;
    return str.substring(0, length) + '...';
}
/**
 * Calculate percentage
 */
export function percentage(value, total) {
    if (total === 0)
        return 0;
    return (value / total) * 100;
}
/**
 * Clamp number between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Check if user has permission
 */
import { ROLE_PERMISSIONS, USER_ROLES } from '../constants';
export function hasPermission(role, userPermissions, requiredPermission) {
    // Admin and Owner have all permissions
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.OWNER)
        return true;
    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    if (rolePerms.includes(requiredPermission))
        return true;
    // Check custom user permissions
    if (userPermissions && userPermissions.includes(requiredPermission))
        return true;
    return false;
}
