"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DateTimePicker24h } from "@/components/ui/date-time-picker"

export function AddAppointmentDialog({
  contact,
  clientId,
  sessionId,
}: {
  contact: { id: string; first_name: string; last_name: string }
  clientId: string
  sessionId: string
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    const payload = {
      client_id: clientId,
      contact_id: contact.id,
      session_id: sessionId,
      date: date?.toISOString(),
      status: "confirmed",
    }

    if (!payload.client_id || !payload.contact_id || !payload.session_id || !payload.date) {
      toast.error("Tous les champs sont requis")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/create-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erreur lors de la création")

      toast.success("Rendez-vous ajouté avec succès")
      setIsAdded(true)
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isAdded}>
          {isAdded ? "RDV ajouté" : "Ajouter RDV"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un rendez-vous</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Prospect</Label>
            <Badge variant="outline">{contact.first_name} {contact.last_name}</Badge>
          </div>

          <div className="space-y-1">
            <Label>Date et heure</Label>
            <DateTimePicker24h date={date} setDate={setDate} />
          </div>

          <Button onClick={handleSubmit} disabled={loading || !date} className="w-full">
            {loading ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
