import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: any = null;

export const getDb = () => {
    if (_db) return _db;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('CRITICAL: Missing DATABASE_URL environment variable');
        throw new Error('Database configuration missing');
    }

    // Log partial connection string for debugging (hide credentials)
    console.log('[DB] Connecting to:', connectionString.replace(/:[^:@]*@/, ':****@'));

    try {
        const client = postgres(connectionString, {
            ssl: 'require',
            max: 1, // Serverless: Use single connection per lambda to avoid exhausting pool
            idle_timeout: 20,
            connect_timeout: 10,
            prepare: false, // Disable prepared statements for transaction pooler compatibility
        });
        _db = drizzle(client, { schema });
        console.log('[DB] Connection initialized successfully');
        return _db;
    } catch (error) {
        console.error('[DB] Connection Failed:', error);
        throw error;
    }
};

// Lazy-loaded database instance using Proxy
export const db = new Proxy({} as any, {
    get: (target, prop) => {
        const database = getDb();
        return (database as any)[prop];
    }
});

// Re-export all schema for convenience
export * from './schema';
export * from './migrate';
export type Database = ReturnType<typeof getDb>;
