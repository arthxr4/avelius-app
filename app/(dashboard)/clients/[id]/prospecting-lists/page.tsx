"use client"

import { useEffect, useState } from "react"
import { useCurrentClient } from "@/hooks/use-current-client"
import { type ProspectingList } from "@/lib/schemas/prospecting-list"
import { ProspectingTable } from "@/components/prospecting/prospecting-table"
import { CreateProspectingListDialog } from "@/components/prospecting/create-prospecting-list-dialog"

export default function ProspectingListsPage() {
  const { current } = useCurrentClient()
  const [lists, setLists] = useState<ProspectingList[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLists = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/get-prospecting-lists?client_id=${current.id}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Erreur lors de la récupération des listes")
      const data = await res.json()
      setLists(data)
    } catch (error) {
      console.error("❌ Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (current?.id) {
      fetchLists()
    }
  }, [current?.id])

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Listes de prospection</h1>
        <CreateProspectingListDialog clientId={current.id} onCreated={fetchLists} />
      </div>

      <ProspectingTable
        data={lists}
        clientId={current.id}
        onCreated={fetchLists}
      />
    </div>
  )
}
