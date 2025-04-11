"use client"

import { useEffect, useState } from "react"
import { ClientTable, type Client } from "@/components/client-table"
import { toast } from "sonner"
import { AddClientDialog } from "@/components/clients/add-client-dialog"

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/get-clients", { credentials: "include" })
        if (!res.ok) throw new Error("Erreur lors de la récupération des clients")
        const data = await res.json()
        setClients(data)
      } catch (error) {
        toast.error("Erreur lors de la récupération des clients")
        console.error(error)
      }
    }

    fetchClients()
  }, [])

  const handleDeleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/delete-client?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Erreur lors de la suppression du client")

      setClients((prev) => prev.filter((client) => client.id !== id))
      toast.success("Client supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression du client")
      console.error(error)
    }
  }

  const handleUpdateClient = async (client: Client) => {
    // TODO: Implémenter la modification du client
    console.log("Update client:", client)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Clients</h1>
        <AddClientDialog />
      </div>

      <ClientTable
        clients={clients}
        onDelete={handleDeleteClient}
        onUpdate={handleUpdateClient}
      />
    </div>
  )
} 