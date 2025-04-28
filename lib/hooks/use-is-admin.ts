import { useUserData } from "./use-user-data"

export function useIsAdmin() {
  const { isAdmin, isLoading } = useUserData()
  return { isAdmin, isLoading }
} 