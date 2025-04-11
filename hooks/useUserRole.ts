import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

type UserRole = "admin" | "manager" | "agent"

export function useUserRole() {
  const { user } = useUser()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setLoading(false)
        return
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.primaryEmailAddress.emailAddress)
        .single()

      if (error) {
        console.error("Error fetching user role:", error)
        setLoading(false)
        return
      }

      setRole(data.role)
      setLoading(false)
    }

    fetchUserRole()
  }, [user?.primaryEmailAddress?.emailAddress])

  return { role, loading }
} 