import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, MapPin, User, Briefcase, Mail, Phone, Loader2, MessageCirclePlus } from "lucide-react"
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
import { Contact, Appointment } from "@/types/appointment"

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmé" },
  { value: "done", label: "Terminé" },
  { value: "canceled", label: "Annulé" },
  { value: "reprogrammed", label: "Reporté" },
  { value: "no_show", label: "Non présenté" },
]

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

  const sharedClass =
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"

  return (
    <div className="flex flex-col gap-3 mb-2">
      <Label className="text-muted-foreground pl-2">{label}</Label>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          className={sharedClass}
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
            sharedClass +
            " cursor-pointer select-text border hover:bg-muted transition-colors " +
            (value ? "text-foreground" : "text-muted-foreground italic")
          }
          onClick={() => setEditing(true)}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  )
}

function InlineEditableTextarea({
  value,
  placeholder = "Ajoutez des notes sur ce prospect...",
  onSave,
}: {
  value: string
  placeholder?: string
  onSave: (val: string) => void
}) {
  const [editing, setEditing] = React.useState(value === "")
  const [inputValue, setInputValue] = React.useState(value || "")
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  React.useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  React.useEffect(() => {
    setInputValue(value || "")
    if (value === "") setEditing(true)
  }, [value])

  const handleSave = () => {
    if (inputValue.trim() === "") {
      setEditing(true)
    } else {
      setEditing(false)
    }
    if (inputValue !== value) {
      onSave(inputValue)
    }
  }

  if (editing) {
    return (
      <div>
        <textarea
          ref={textareaRef}
          className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === "Escape") setEditing(false)
            if ((e.key === "Enter" && (e.ctrlKey || e.metaKey))) handleSave()
          }}
        />
        {(!inputValue || inputValue.trim() === "") && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <MessageCirclePlus className="w-12 h-12 mb-2 opacity-60" />
            <div className="font-semibold text-xl text-foreground">Ajouter une note</div>
            <div className="text-sm text-muted-foreground">Ajoutez ici toute information pertinente sur ce contact</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={
        "min-h-[24px] text-sm whitespace-pre-line cursor-pointer rounded-md px-2 py-1 " +
        (value ? "text-foreground" : "text-muted-foreground border border-dashed border-input")
      }
      onClick={() => setEditing(true)}
      tabIndex={0}
      role="button"
      aria-label="Edit notes"
    >
      {value || placeholder}
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
    first_name: appointment?.contacts.first_name || "",
    last_name: appointment?.contacts.last_name || "",
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
        first_name: appointment.contacts.first_name || "",
        last_name: appointment.contacts.last_name || "",
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
    contactFields.first_name !== appointment.contacts.first_name ||
    contactFields.last_name !== appointment.contacts.last_name ||
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
            first_name: contactFields.first_name,
            last_name: contactFields.last_name,
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
            first_name: contactFields.first_name,
            last_name: contactFields.last_name,
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
      <SheetContent className="w-[500px] sm:w-[700px] sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <SheetTitle>Détails</SheetTitle>
        </SheetHeader>

        {/* Contact Info Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background border border-foreground">
              <span className="text-xl font-semibold">
                {appointment.contacts.first_name[0]}
                
              </span>
            </div>
            <div>
              <div className="font-semibold text-xl">
                {appointment.contacts.first_name} {appointment.contacts.last_name}
              </div>
              <div className="text-sm text-muted-foreground font-normal ">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-background border border-muted-foreground text-foreground font-bold text-[9px]">
                    {appointment.contacts.company ? appointment.contacts.company[0].toUpperCase() : ""}
                  </span>
                  <span className="underline underline-offset-4">{capitalize(appointment.contacts.company)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-2">
              Détails
            </TabsTrigger>
            <TabsTrigger value="meetings" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-2">
              Rendez-vous
            </TabsTrigger>
            <TabsTrigger value="notes" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-2">
              Notes
              <span className="rounded bg-muted text-muted-foreground group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600 px-1.5 py-0.5 text-xs transition-colors">
                {notes && notes.trim() !== "" ? 1 : 0}
              </span>
            </TabsTrigger>
          </TabsList>
          <div className="mb-4" />
          <TabsContent value="details">
            <div className="space-y-6 pt-2">
              {/* Champs du contact en style image */}
              <InlineEditableField
                label="Prénom"
                value={contactFields.first_name}
                onSave={val => setContactFields(f => ({ ...f, first_name: val }))}
                placeholder="Ajouter un prénom"
              />
              <InlineEditableField
                label="Nom"
                value={contactFields.last_name}
                onSave={val => setContactFields(f => ({ ...f, last_name: val }))}
                placeholder="Ajouter un nom"
              />
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
                <InlineEditableTextarea
                  value={notes}
                  onSave={setNotes}
                  placeholder="Ajoutez des notes sur ce prospect..."
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