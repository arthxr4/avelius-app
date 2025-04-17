"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTeam } from "@/lib/team-context"
import { useIsAdmin } from "@/lib/hooks/use-is-admin"
import { useUser } from "@clerk/nextjs"

export default function HomePage() {
  const router = useRouter()
  const { current, teams, isLoading: isLoadingTeam, error } = useTeam()
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin()
  const { isLoaded: isClerkLoaded, isSignedIn } = useUser()

  useEffect(() => {
    const handleRedirect = async () => {
      // Attendre que tout soit chargé
      if (!isClerkLoaded || isLoadingTeam || isLoadingAdmin) {
        return
      }

      // Si non connecté, rediriger vers la connexion
      if (!isSignedIn) {
        router.push("/sign-in")
        return
      }

      try {
        // Si admin, rediriger vers la page admin ou le client sélectionné
        if (isAdmin) {
          if (current) {
            router.push(`/clients/${current.id}`)
          } else {
            router.push("/admin/clients-manager")
          }
          return
        }

        // Si erreur lors du chargement des clients
        if (error) {
          console.error("Erreur lors du chargement des clients:", error)
          router.push("/unauthorized")
          return
        }

        // Pour les managers, attendre d'avoir les données des clients
        if (!teams || teams.length === 0) {
          return // On attend que les données soient chargées
        }

        // Si on a un client sélectionné, l'utiliser
        if (current) {
          router.push(`/clients/${current.id}`)
          return
        }

        // Si on a des clients mais aucun sélectionné, utiliser le premier
        router.push(`/clients/${teams[0].id}`)
      } catch (error) {
        console.error("Erreur lors de la redirection:", error)
        router.push("/unauthorized")
      }
    }

    handleRedirect()
  }, [isClerkLoaded, isSignedIn, current, teams, isLoadingTeam, isLoadingAdmin, isAdmin, router, error])

  // Afficher un état de chargement pendant la redirection
  if (!isClerkLoaded || isLoadingTeam || isLoadingAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  return null
}
