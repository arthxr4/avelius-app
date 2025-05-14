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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import React from "react"

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
  notes?: string
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

function InlineEditableField({
  label,
  value,
  placeholder = "Add text",
  onSave,
  type = "text",
}: {
  label: string
  value: string
  placeholder?: string
  onSave: (val: string) => void
  type?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  const handleSave = () => {
    setEditing(false)
    if (inputValue !== value) {
      onSave(inputValue)
    }
  }

  return (
    <div className="space-y-3 mb-2">
      <Label className="text-muted-foreground">{label}</Label>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") setEditing(false)
          }}
          placeholder={placeholder}
        />
      ) : (
        <div
          className={
            "min-h-[24px] text-sm cursor-pointer " +
            (value ? "text-foreground" : "text-muted-foreground")
          }
          onClick={() => setEditing(true)}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  )
}

export function AppointmentDetailsSheet({
  appointment,
  open,
  onOpenChange,
  onUpdate,
}: AppointmentDetailsSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState(appointment?.status || "")
  const [notes, setNotes] = useState(appointment?.notes || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [contactFields, setContactFields] = useState({
    email: appointment?.contacts.email || "",
    phone: appointment?.contacts.phone || "",
    company: appointment?.contacts.company || "",
  })

  useEffect(() => {
    if (appointment) {
      setSelectedDate(new Date(appointment.date))
      setStatus(appointment.status)
      setNotes(appointment.notes || "")
      setContactFields({
        email: appointment.contacts.email || "",
        phone: appointment.contacts.phone || "",
        company: appointment.contacts.company || "",
      })
    }
  }, [appointment])

  if (!appointment) return null

  const hasChanges = 
    selectedDate?.toISOString() !== new Date(appointment.date).toISOString() ||
    status !== appointment.status ||
    notes !== (appointment.notes || "") ||
    contactFields.email !== appointment.contacts.email ||
    contactFields.phone !== appointment.contacts.phone ||
    contactFields.company !== appointment.contacts.company

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
          notes,
          contacts: {
            ...appointment.contacts,
            email: contactFields.email,
            phone: contactFields.phone,
            company: contactFields.company,
          },
        }),
      })

      if (response.ok) {
        onUpdate({
          ...appointment,
          date: selectedDate.toISOString(),
          status,
          notes,
          contacts: {
            ...appointment.contacts,
            email: contactFields.email,
            phone: contactFields.phone,
            company: contactFields.company,
          },
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

        {/* Contact Info Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <span className="text-sm font-medium">
                {appointment.contacts.first_name[0]}
                {appointment.contacts.last_name[0]}
              </span>
            </div>
            <div>
              <div className="font-medium text-lg">
                {appointment.contacts.first_name} {appointment.contacts.last_name}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {capitalize(appointment.contacts.company)}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-3">
              Détails
            </TabsTrigger>
            <TabsTrigger value="meetings" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-3">
              Rendez-vous
            </TabsTrigger>
            <TabsTrigger value="notes" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-3">
              Notes
            </TabsTrigger>
          </TabsList>
          <div className="mb-4" />
          <TabsContent value="details">
            <div className="space-y-6">
              {/* Champs du contact en style image */}
              <InlineEditableField
                label="Email"
                value={contactFields.email}
                onSave={val => setContactFields(f => ({ ...f, email: val }))}
                type="email"
                placeholder="Ajouter un email"
              />
              <InlineEditableField
                label="Téléphone"
                value={contactFields.phone}
                onSave={val => setContactFields(f => ({ ...f, phone: val }))}
                type="tel"
                placeholder="Ajouter un téléphone"
              />
              <InlineEditableField
                label="Entreprise"
                value={contactFields.company}
                onSave={val => setContactFields(f => ({ ...f, company: val }))}
                placeholder="Ajouter une entreprise"
              />
            </div>
          </TabsContent>
          <TabsContent value="meetings">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-muted-foreground">Date et heure</Label>
                <DateTimePicker 
                  date={selectedDate} 
                  onSelect={(newDate) => newDate && setSelectedDate(newDate)}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-muted-foreground">Statut</Label>
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
          </TabsContent>
          <TabsContent value="notes">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-muted-foreground">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ajoutez des notes sur ce prospect..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

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