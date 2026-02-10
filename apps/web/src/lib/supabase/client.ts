'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('[Supabase] Missing environment variables — client will not function until they are set.')
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
