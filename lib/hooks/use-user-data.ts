import { useEffect, useState } from "react"

interface UserData {
  id: string
  email: string
  role: "admin" | "manager" | "agent"
  first_name: string
  last_name: string
  avatar_url: string | null
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/user-data")
        if (!res.ok) {
          setUserData(null)
          setIsLoading(false)
          return
        }
        const data = await res.json()
        setUserData(data)
      } catch (error) {
        setUserData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [])

  return {
    user: userData,
    isAdmin: userData?.role === 'admin',
    isLoading,
    isAuthenticated: !!userData
  }
} 