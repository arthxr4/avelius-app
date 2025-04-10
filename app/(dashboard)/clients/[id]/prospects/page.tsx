"use client"

import { useEffect, useState } from "react"
import { useTeam } from "@/lib/team-context"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/prospects/table"
import { columns } from "./columns"
import { type Contact } from "@/lib/schemas/contact"
import { AddContactDialog } from "@/components/add-contact-dialog"

export default function ProspectsPage() {
  const { current } = useTeam()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = async () => {
    const res = await fetch(`/api/get-contacts?client_id=${current?.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    const data = await res.json()
    setContacts(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!current) return
    fetchContacts()
  }, [current])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prospects</h1>
        {current && (
          <AddContactDialog
          clientId={current.id}
          onAdded={() => fetchContacts()} // ou refetch logic
        />
        )}
      </div>

      {loading ? (
        <Skeleton className="h-4 w-1/3" />
      ) : contacts.length === 0 ? (
        <p className="text-muted-foreground">Aucun prospect trouvé.</p>
      ) : (
        <DataTable columns={columns} data={contacts} />
      )}
    </div>
  )
}
