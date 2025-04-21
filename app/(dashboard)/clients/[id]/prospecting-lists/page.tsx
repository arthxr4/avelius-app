"use client"

import { useEffect, useState } from "react"
import { useCurrentClient } from "@/hooks/use-current-client"
import { type ProspectingList } from "@/lib/schemas/prospecting-list"
import { ProspectingTable } from "@/components/prospecting/prospecting-table"
import { CreateProspectingListDialog } from "@/components/prospecting/create-prospecting-list-dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function ProspectingListsPage() {
  const { current } = useCurrentClient()
  const [lists, setLists] = useState<ProspectingList[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchLists = async () => {
    try {
      setLoading(true)
      if (!current?.id) return
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

  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(search.toLowerCase())
  )

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="">
          <h1 className="text-xl font-bold">Listes de prospection</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos listes de prospects et suivez leur progression
          </p>
        </div>
        <CreateProspectingListDialog clientId={current.id} onCreated={fetchLists} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une liste..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ProspectingTable
        data={filteredLists}
        clientId={current.id}
        onCreated={fetchLists}
      />
    </div>
  )
}
