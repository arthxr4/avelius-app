"use client"

import { useEffect, useState } from "react"
import { useCurrentClient } from "@/hooks/use-current-client"
import { ProspectingListContactsTable } from "@/components/prospecting/list-contacts-table"
import { ImportContactsDialog } from "@/components/prospecting/import-contacts-dialog"

interface Props {
  params: {
    id: string
    list_id: string
  }
}

export default function ProspectingListDetailsPage({ params }: Props) {
  const { current } = useCurrentClient()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<any>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/get-prospecting-list?id=${params.list_id}`)
        if (!res.ok) throw new Error("Erreur lors de la récupération de la liste")
        const data = await res.json()
        setList(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.list_id) {
      fetchList()
    }
  }, [params.list_id])

  if (!current || !list) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{list.title}</h1>
        <ImportContactsDialog listId={params.list_id} onImported={() => setLoading(true)} />
      </div>

      <ProspectingListContactsTable
        clientId={params.id}
        listId={params.list_id}
      />
    </div>
  )
}
