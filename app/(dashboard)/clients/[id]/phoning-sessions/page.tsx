"use client"

import { useEffect, useState } from "react"
import { useTeam } from "@/lib/team-context"
import { type PhoningSession } from "@/lib/schemas/phoning-session"
import { Skeleton } from "@/components/ui/skeleton"
import { PhoningTable } from "@/components/phoning/table"
import { CreatePhoningSessionDialog } from "@/components/phoning/create-phoning-session-dialog"

export default function PhoningSessionsPage() {
  const { current } = useTeam()
  const [sessions, setSessions] = useState<PhoningSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = async () => {
    if (!current) return
    const res = await fetch("/api/get-phoning-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: current.id }),
      credentials: "include",
    })

    const data = await res.json()
    setSessions(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSessions()
  }, [current])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions de phoning</h1>
        {current && (
          <CreatePhoningSessionDialog clientId={current.id} onCreated={fetchSessions} />
        )}
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
          onRowClick={(session) => console.log("Afficher les prospects liés à", session)}
        />
      )}
    </div>
  )
}
