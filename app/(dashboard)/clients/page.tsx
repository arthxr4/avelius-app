"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Client = {
  id: string
  name: string
  domain?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [newClientName, setNewClientName] = useState("")

  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch("/api/get-clients", { credentials: "include" })
      const data = await res.json()
      setClients(data)
    }

    fetchClients()
  }, [])

  const handleCreateClient = async () => {
    const res = await fetch("/api/create-client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newClientName }),
      credentials: "include",
    })

    const data = await res.json()
    if (res.ok) {
      setClients((prev) => [...prev, data])
      setOpen(false)
      setNewClientName("")
    } else {
      alert("Erreur : " + data.error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau client</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Nom du client"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
            <DialogFooter className="mt-4">
              <Button onClick={handleCreateClient}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Nom</th>
              <th className="py-2">Domaine</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b">
                <td className="py-2">{client.name}</td>
                <td className="py-2">{client.domain ?? "—"}</td>
                <td className="py-2 text-right space-x-2">
                  <Button variant="outline" size="sm">Modifier</Button>
                  <Button variant="destructive" size="sm">Supprimer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
