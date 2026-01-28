import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (_supabase) return _supabase;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('CRITICAL: Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
        throw new Error('Supabase configuration missing');
    }

    _supabase = createClient(url, key);
    return _supabase;
};

// Legacy Export (Proxied to lazy getter)
export const supabase = new Proxy({} as SupabaseClient, {
    get: (target, prop) => {
        const client = getSupabase();
        return (client as any)[prop];
    }
});

export const supabaseAdmin = supabase;
