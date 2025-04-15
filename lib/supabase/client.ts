// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create an anonymous client for non-authenticated operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hook to get an authenticated Supabase client
export function useSupabaseClient() {
  const { getToken } = useAuth()
  const [client, setClient] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    const initializeClient = async () => {
      const token = await getToken({ template: 'supabase' })
      if (token) {
        const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        })
        setClient(authenticatedClient)
      }
    }

    initializeClient()
  }, [getToken])

  return client || supabase // Fall back to anonymous client if not authenticated
}
