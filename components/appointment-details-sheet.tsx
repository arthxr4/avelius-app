import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, MapPin, User, Briefcase, Mail, Phone, Loader2 } from "lucide-react"
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
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Separator } from "@/components/ui/separator"

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
  client_id: string
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

const capitalize = (str: string) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
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

  const hasChanges = 
    selectedDate?.toISOString() !== new Date(appointment.date).toISOString() ||
    status !== appointment.status

  const handleUpdate = async () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date")
      return
    }

    if (!hasChanges) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/update-appointment/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: appointment.id,
          client_id: appointment.client_id,
          contact_id: appointment.contact_id,
          date: selectedDate.toISOString(),
          status,
        }),
      })

      if (response.ok) {
        onUpdate({
          ...appointment,
          date: selectedDate.toISOString(),
          status,
        })
        toast.success("Rendez-vous mis à jour avec succès")
        onOpenChange(false)
      } else {
        const responseData = await response.json()
        toast.error(responseData.error || "Erreur lors de la mise à jour du rendez-vous")
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
        <SheetHeader className="space-y-1">
          <SheetTitle>Détails du rendez-vous</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Who section */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Prospect</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">
                    {appointment.contacts.first_name[0]}
                    {appointment.contacts.last_name[0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium">
                    {appointment.contacts.first_name} {appointment.contacts.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                  {capitalize(appointment.contacts.company)}
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Job section */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Entreprise</Label>
            <div className="flex items-center justify-between">
              <div className="font-medium">{capitalize(appointment.contacts.company)}</div>
             
            </div>
          </div>

          {/* When section */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Date et heure</Label>
            <DateTimePicker 
              date={selectedDate} 
              onSelect={(newDate) => newDate && setSelectedDate(newDate)}
            />
          </div>

          {/* Status section */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={setStatus}>
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

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-muted/50 border-t">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !hasChanges}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 