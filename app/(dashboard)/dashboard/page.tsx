"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTeam } from "@/lib/team-context"
import { useIsAdmin } from "@/lib/hooks/use-is-admin"
import { useUser } from "@clerk/nextjs"

export default function DashboardPage() {
  const router = useRouter()
  const { current } = useTeam()
  const { isAdmin } = useIsAdmin()
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }

    if (current) {
      router.push(`/clients/${current.id}`)
    } else if (isAdmin) {
      router.push("/admin/overview")
    }
  }, [isLoaded, isSignedIn, current, isAdmin, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Chargement...</div>
    </div>
  )
} 