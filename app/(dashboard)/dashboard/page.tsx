"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTeam } from "@/lib/team-context"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { current } = useTeam()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="aspect-video rounded-xl bg-muted/50 p-4">
        <h2 className="text-xl font-bold">Bienvenue, {user?.firstName} 👋</h2>
        <p className="text-muted-foreground">
          Connecté avec : {user?.emailAddresses[0]?.emailAddress}
        </p>

        {current && (
          <div className="mt-4 text-sm">
            <p>🧠 Client sélectionné : <strong>{current.name}</strong></p>
            <p>🌐 Domaine : {current.domain ?? "Non défini"}</p>
          </div>
        )}

        <Button
          variant="outline"
          className="mt-4"
          onClick={async () => {
            const res = await fetch("/api/whoami", { credentials: "include" })
            const data = await res.json()
            alert("userId côté serveur : " + (data.userId ?? "undefined"))
          }}
        >
          🔍 Tester userId côté serveur
        </Button>
      </div>

      <div className="aspect-video rounded-xl bg-muted/50" />
      <div className="aspect-video rounded-xl bg-muted/50" />

      <div className="min-h-[100vh] rounded-xl bg-muted/50 md:col-span-3 md:min-h-min" />
    </div>
  )
}
