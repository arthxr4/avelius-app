"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DateTimePicker } from "@/components/ui/date-time-picker"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

interface Props {
  clientId: string
  listId: string
  contact: Contact
  trigger: React.ReactNode
}

export function AddAppointmentDialog({ clientId, listId, contact, trigger }: Props) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date>()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) {
      toast.error("Veuillez sélectionner une date et heure")
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/create-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          contact_id: contact.id,
          list_id: listId,
          date: date.toISOString(),
        }),
      })

      if (!res.ok) throw new Error("Erreur lors de la création du rendez-vous")

      toast.success("Rendez-vous créé avec succès")
      setOpen(false)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la création du rendez-vous")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
          <DialogDescription>
            Planifier un rendez-vous avec ce contact.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto pr-6 -mr-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label>Contact sélectionné</Label>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  {contact.company && (
                    <div className="text-sm text-muted-foreground">
                      {contact.company}
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    {contact.email && (
                      <div className="text-muted-foreground">
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="text-muted-foreground">
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date et heure du rendez-vous</Label>
                <DateTimePicker 
                  date={date} 
                  onSelect={setDate}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading || !date}>
                {loading ? "Création..." : "Créer le rendez-vous"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
