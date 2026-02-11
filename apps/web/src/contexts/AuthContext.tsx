'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@smartbiz/shared'
import { hasPermission } from '@smartbiz/shared'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, userData: {
        first_name: string
        last_name: string
    }) => Promise<void>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    checkPermission: (permission: string) => boolean
    getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    // Import dynamically or use directly if available.
    // For client components, we need to ensure shared code is transpiled.
    // We'll implement the logic directly using the utility to avoid extra imports if possible,
    // but better to reuse shared logic.

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            if (error) throw error

            if (data) {
                const raw = data as any
                const mappedProfile: Profile = {
                    id: raw.id,
                    organizationId: raw.organization_id,
                    userId: raw.user_id,
                    firstName: raw.first_name,
                    lastName: raw.last_name,
                    phone: raw.phone,
                    avatar: raw.avatar,
                    role: raw.role,
                    permissions: raw.permissions,
                    isActive: raw.is_active,
                    createdAt: new Date(raw.created_at),
                    updatedAt: new Date(raw.updated_at),
                    createdBy: raw.created_by,
                    updatedBy: raw.updated_by,
                    deletedAt: raw.deleted_at ? new Date(raw.deleted_at) : undefined,
                    version: raw.version || 1
                }
                setProfile(mappedProfile)
            }
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
    }

    const signUp = async (
        email: string,
        password: string,
        userData: {
            first_name: string
            last_name: string
        }
    ) => {
        // Use current origin for redirect, or fall back to public app url env
        const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData,
                emailRedirectTo: `${origin}/dashboard`,
            },
        })
        if (error) throw error
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }

    const checkPermission = (permission: string): boolean => {
        if (!profile) return false
        return hasPermission(profile.role, profile.permissions as string[], permission)
    }

    const getToken = async (): Promise<string | null> => {
        if (session?.access_token) return session.access_token
        const { data } = await supabase.auth.getSession()
        return data.session?.access_token ?? null
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                signIn,
                signUp,
                signOut,
                refreshProfile,
                checkPermission,
                getToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
