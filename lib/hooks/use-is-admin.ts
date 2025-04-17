import { useUser } from "@clerk/nextjs"
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from "react"

export function useIsAdmin() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      // Si Clerk n'est pas chargé, on attend
      if (!isClerkLoaded) return

      // Si pas d'utilisateur connecté, on reset
      if (!clerkUser) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // Si pas d'email, on reset
      if (!clerkUser.emailAddresses[0]?.emailAddress) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }
      
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('email', clerkUser.emailAddresses[0].emailAddress)
          .single()

        if (error) {
          console.error("Error fetching user role:", error)
          setIsAdmin(false)
          return
        }

        setIsAdmin(data?.role === 'admin')
      } catch (error) {
        console.error("Error in fetchUserRole:", error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [clerkUser, isClerkLoaded])

  return { isAdmin, isLoading }
} 