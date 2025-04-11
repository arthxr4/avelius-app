import { useUserRole } from "@/hooks/useUserRole"
import { useRouter } from "next/navigation"
import { ComponentType, useEffect } from "react"

export function withRoleGuard(
  WrappedComponent: ComponentType,
  allowedRoles: ("admin" | "manager" | "agent")[]
) {
  return function ProtectedRoute(props: any) {
    const { role, loading } = useUserRole()
    const router = useRouter()

    useEffect(() => {
      if (!loading && (!role || !allowedRoles.includes(role))) {
        router.push("/") // Rediriger vers la page d'accueil si non autorisé
      }
    }, [role, loading, router])

    if (loading) {
      return <div>Loading...</div> // Ou votre composant de loading
    }

    if (!role || !allowedRoles.includes(role)) {
      return null
    }

    return <WrappedComponent {...props} />
  }
} 