"use client"

import { useEffect, useState, use } from "react"
import { useCurrentClient } from "@/hooks/use-current-client"
import { ProspectingListContactsTable } from "@/components/prospecting/list-contacts-table"
import { ImportContactsDialog } from "@/components/prospecting/import-contacts-dialog"

interface RouteParams {
  id: string
  list_id: string
}

interface Props {
  params: Promise<RouteParams>
}

export default function ProspectingListDetailsPage({ params: paramsPromise }: Props) {
  const params = use(paramsPromise) as RouteParams
  const { current } = useCurrentClient()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<any>(null)
  const { id, list_id } = params

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/get-prospecting-list?id=${list_id}`)
        if (!res.ok) throw new Error("Erreur lors de la récupération de la liste")
        const data = await res.json()
        setList(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (list_id) {
      fetchList()
    }
  }, [list_id])

  if (!current || !list) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{list.title}</h1>
        <ImportContactsDialog listId={list_id} onImported={() => setLoading(true)} />
      </div>

      <ProspectingListContactsTable
        clientId={id}
        listId={list_id}
      />
    </div>
  )
}
