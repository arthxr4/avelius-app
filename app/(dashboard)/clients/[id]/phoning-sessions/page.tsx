"use client"

import { useEffect, useState } from "react"
import { useTeam } from "@/lib/team-context"
import { type PhoningSession } from "@/lib/schemas/phoning-session"
import { Skeleton } from "@/components/ui/skeleton"
import { PhoningTable } from "@/components/phoning/table"
import { CreatePhoningSessionDialog } from "@/components/phoning/create-phoning-session-dialog"
import { useRouter } from "next/navigation"

export default function PhoningSessionsPage() {
  const { current } = useTeam()
  const router = useRouter()
  const [sessions, setSessions] = useState<PhoningSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = async () => {
    if (!current) return
    try {
      const res = await fetch(`/api/get-phoning-sessions?client_id=${current.id}`, {
        method: "GET",
        next: { revalidate: 60 }, // Cache pendant 1 minute
      })

      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des sessions")
      }

      const data = await res.json()
      setSessions(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [current])

  // Vérifier si current existe avant de rendre le contenu
  if (!current) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions de phoning</h1>
        <CreatePhoningSessionDialog clientId={current.id} onCreated={fetchSessions} />
      </div>

      {loading ? (
        <Skeleton className="h-4 w-1/3" />
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground">Aucune session trouvée.</p>
      ) : (
        <PhoningTable
          data={sessions}
          clientId={current.id}
          onCreated={fetchSessions}
        />
      )}
    </div>
  )
}
