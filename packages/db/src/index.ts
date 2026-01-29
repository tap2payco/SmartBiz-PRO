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

    const client = postgres(connectionString, {
        ssl: 'require',
        max: 10, // Limit connections for serverless
        idle_timeout: 20,
        connect_timeout: 10,
    });
    _db = drizzle(client, { schema });
    return _db;
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
export type Database = ReturnType<typeof getDb>;
