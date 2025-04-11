import { useUserRole } from "@/hooks/useUserRole"
import { ReactNode } from "react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: ("admin" | "manager" | "agent")[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, loading } = useUserRole()

  if (loading) {
    return null // ou un loader si vous préférez
  }

  if (!role || !allowedRoles.includes(role)) {
    return null
  }

  return <>{children}</>
} 