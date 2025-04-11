import { useUserRole } from "@/hooks/useUserRole"

export const useIsAdmin = () => {
  const { role, loading } = useUserRole()

  return {
    isAdmin: role === "admin",
    loading
  }
} 