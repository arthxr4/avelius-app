"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { type SessionContact } from "./list-contacts-table"

interface AddAppointmentDialogProps {
  clientId: string
  listId: string
  onCreated?: () => void
  contact?: SessionContact
  trigger?: React.ReactNode
}

export function AddAppointmentDialog({
  clientId,
  listId,
  onCreated,
  contact,
  trigger,
}: AddAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [date, setDate] = useState<Date>()
  const [results, setResults] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(contact || null)

  async function handleSearch(value: string) {
    setSearch(value)
    if (!value) {
      setResults([])
      return
    }

    try {
      const response = await fetch(
        `/api/search-contacts?query=${value}&list_id=${listId}`
      )
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error("Erreur lors de la recherche des contacts")
    }
  }

  async function handleSubmit() {
    if (!selectedContact || !date) {
      toast.error("Veuillez sélectionner un contact et une date")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/create-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          contact_id: selectedContact.id,
          list_id: listId,
          date: date.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la création du rendez-vous")
      }

      toast.success("Rendez-vous créé avec succès")
      setOpen(false)
      onCreated?.()
    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error("Erreur lors de la création du rendez-vous")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            Ajouter un rendez-vous
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un rendez-vous</DialogTitle>
          <DialogDescription>
            Recherchez un contact et sélectionnez une date pour le rendez-vous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Rechercher un contact..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div className="border rounded-md divide-y">
                {results.map((contact) => (
                  <button
                    key={contact.id}
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors",
                      selectedContact?.id === contact.id && "bg-muted"
                    )}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {contact.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedContact && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Contact sélectionné</div>
              <div className="p-4 rounded-md bg-muted">
                <div className="font-medium">{selectedContact.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedContact.phone}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="text-sm font-medium">Date du rendez-vous</div>
            <DatePicker date={date} onSelect={setDate} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedContact || !date || loading}
          >
            {loading ? "Création..." : "Créer le rendez-vous"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
