import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { DateTimePicker24h } from "@/components/ui/date-time-picker"

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmé" },
  { value: "done", label: "Terminé" },
  { value: "canceled", label: "Annulé" },
  { value: "reprogrammed", label: "Reporté" },
  { value: "no_show", label: "Non présenté" },
]

type Contact = {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

type Appointment = {
  id: string
  contact_id: string
  status: string
  date: string
  contacts: Contact
}

interface AppointmentDetailsSheetProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (appointment: Appointment) => void
}

export function AppointmentDetailsSheet({
  appointment,
  open,
  onOpenChange,
  onUpdate,
}: AppointmentDetailsSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState(appointment?.status || "")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (appointment) {
      setSelectedDate(new Date(appointment.date))
      setStatus(appointment.status)
    }
  }, [appointment])

  if (!appointment) return null

  const handleUpdate = async () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/update-appointment", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: appointment.id,
          date: selectedDate.toISOString(),
          status,
        }),
      })

      if (response.ok) {
        const updatedAppointment = await response.json()
        onUpdate({
          ...appointment,
          ...updatedAppointment,
          date: selectedDate.toISOString(),
          status,
        })
        toast.success("Rendez-vous mis à jour avec succès")
        onOpenChange(false)
      } else {
        const error = await response.json()
        console.error("Erreur lors de la mise à jour:", error)
        toast.error("Erreur lors de la mise à jour du rendez-vous")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du rendez-vous")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Détails du rendez-vous</SheetTitle>
          <SheetDescription className="text-base">
            Avec {appointment.contacts.first_name} {appointment.contacts.last_name}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-6">
            <h3 className="text-sm font-medium">Contact</h3>
            <div className="grid gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1.5">Nom complet</div>
                <div className="text-base">
                  {appointment.contacts.first_name} {appointment.contacts.last_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1.5">Email</div>
                <div className="text-base">
                  {appointment.contacts.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1.5">Téléphone</div>
                <div className="text-base">
                  {appointment.contacts.phone}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1.5">Entreprise</div>
                <div className="text-base">
                  {appointment.contacts.company}
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Date et heure</Label>
            <DateTimePicker24h
              date={selectedDate}
              setDate={setSelectedDate}
            />
          </div>
          <div className="grid gap-2">
            <Label>Statut</Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 