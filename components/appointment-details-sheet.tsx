import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, MapPin, User, Briefcase, Mail, Phone, Loader2, MessageCirclePlus, MoreHorizontal } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Switch } from "@/components/ui/switch"
import { Bold, Italic, Underline as UnderlineIcon, Quote, List, ListOrdered, Link as LinkIcon, Paperclip } from "lucide-react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import LinkExtension from '@tiptap/extension-link'
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import MinimalTiptapOne from "@/components/minimal-tiptap/MinimalTiptapOne"
import { useUser } from "@clerk/nextjs"

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

function isEditorContentEmpty(html: string) {
  if (!html) return true
  // Supprime les balises vides, espaces, <br>, etc.
  const cleaned = html
    .replace(/<br\s*\/?>(\s*)/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<[^>]+>/g, '') // retire toutes les balises
    .replace(/\s+/g, '')
  return cleaned.length === 0
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
  const [contactFields, setContactFields] = useState({
    first_name: appointment?.contacts.first_name || "",
    last_name: appointment?.contacts.last_name || "",
    email: appointment?.contacts.email || "",
    phone: appointment?.contacts.phone || "",
    company: appointment?.contacts.company || "",
  })
  const [contactDetails, setContactDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [savingEdit, setSavingEdit] = useState(false)
  const { user } = useUser()
  const currentUserId = user?.id

  // TipTap editor for note input
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setNewNote(editor.getHTML())
    },
  })

  useEffect(() => {
    if (appointment) {
      setSelectedDate(new Date(appointment.date))
      setStatus(appointment.status)
      setContactFields({
        first_name: appointment.contacts.first_name || "",
        last_name: appointment.contacts.last_name || "",
        email: appointment.contacts.email || "",
        phone: appointment.contacts.phone || "",
        company: appointment.contacts.company || "",
      })
    }
  }, [appointment])

  // Fetch contact details (contact, notes, appointments)
  useEffect(() => {
    const fetchDetails = async () => {
      if (!appointment?.contacts?.id) return
      setLoadingDetails(true)
      const res = await fetch(`/api/contact/get?id=${appointment.contacts.id}`)
      const data = await res.json()
      setContactDetails(data)
      setLoadingDetails(false)
    }
    fetchDetails()
  }, [appointment?.contacts?.id])

  if (!appointment) return null

  const hasChanges = 
    selectedDate?.toISOString() !== new Date(appointment.date).toISOString() ||
    status !== appointment.status ||
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

  // Ajout d'une note via API
  const handleAddNote = async () => {
    if (!newNote.trim() || !appointment?.contacts?.id) return
    setAddingNote(true)
    const response = await fetch("/api/contact-note/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_id: appointment.contacts.id,
        content: newNote.trim(),
      }),
    })
    if (response.ok) {
      setNewNote("")
      editor?.commands.setContent('')
      // Refetch contact details pour rafraîchir les notes
      const res = await fetch(`/api/contact/get?id=${appointment.contacts.id}`)
      const data = await res.json()
      setContactDetails(data)
    } else {
      toast.error("Erreur lors de l'ajout de la note")
    }
    setAddingNote(false)
  }

  // Suppression d'une note via API
  const handleDeleteNote = async (noteId: string) => {
    if (!noteId) return
    try {
      const response = await fetch('/api/contact-note/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      })
      if (response.ok) {
        // Refetch notes
        const res = await fetch(`/api/contact/get?id=${appointment.contacts.id}`)
        const data = await res.json()
        setContactDetails(data)
        toast.success('Note supprimée')
      } else {
        toast.error("Erreur lors de la suppression de la note")
      }
    } catch (e) {
      toast.error("Erreur lors de la suppression de la note")
    }
  }

  // Utilisation des données fetchées
  const contact = contactDetails?.contact || appointment.contacts
  const notes = contactDetails?.notes || []
  const appointments = contactDetails?.appointments || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[700px] sm:max-w-xl flex flex-col h-full">
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

        <div className="flex-1 min-h-0 overflow-y-auto mt-6">
          <Tabs defaultValue="details">
            <TabsList className="w-full sticky top-0 bg-background z-10">
              <TabsTrigger value="details" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-2">
                Détails
              </TabsTrigger>
              <TabsTrigger value="meetings" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-2">
                Rendez-vous
              </TabsTrigger>
              <TabsTrigger value="notes" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-2">
                Notes
                <span className="rounded bg-muted text-muted-foreground group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600 px-1.5 py-0.5 text-xs transition-colors">
                  {notes.length}
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
              <div className="flex flex-col h-full min-h-0 space-y-4">
                <div className="flex flex-col">
                  <MinimalTiptapOne
                    value={newNote}
                    onChange={setNewNote}
                    placeholder="Ajoutez une note..."
                    editorClassName="minimal-tiptap-editor focus:outline-none px-5 py-4 h-full"
                    editable={true}
                    actionButton={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddNote}
                        disabled={addingNote || isEditorContentEmpty(newNote)}
                      >
                        {addingNote ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                        Ajouter une note
                      </Button>
                    }
                  />
                </div>
                {loadingDetails ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <MessageCirclePlus className="w-12 h-12 mb-2 opacity-60" />
                    <div className="font-semibold text-xl text-foreground">Aucune note</div>
                    <div className="text-sm text-muted-foreground">Ajoutez ici des commentaires sur ce contact</div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 max-h-full overflow-y-auto pb-16">
                    {notes.map((note: any, idx: number) => {
                      const isEditing = editingNoteId === note.id
                      return (
                        <div key={note.id} className="group flex items-start gap-3 px-3 py-4 pb-0 relative">
                          {/* Avatar */}
                          {note.users?.avatar_url ? (
                            <img
                              src={note.users.avatar_url}
                              alt={note.users.first_name || 'Avatar'}
                              className="h-8 w-8 rounded-full object-cover bg-muted"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground font-semibold text-base">
                              {note.users?.first_name ? note.users.first_name[0].toUpperCase() : (note.user_id ? note.user_id[0].toUpperCase() : 'U')}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {note.users ? `${note.users.first_name} ${note.users.last_name}` : note.user_id || 'Utilisateur'}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {note.created_at ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: fr }) : ''}
                                {note.edit && <span className="">(modifié)</span>}
                              </span>
                            </div>
                            {isEditing ? (
                              <div className="relative mt-1">
                                <MinimalTiptapOne
                                  value={editingContent}
                                  onChange={setEditingContent}
                                  placeholder="Modifier la note..."
                                  editorClassName="minimal-tiptap-editor focus:outline-none px-5 py-4 h-full"
                                  editable={true}
                                  actionButton={
                                    <div className="flex items-center justify-end gap-2 w-full">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingNoteId(null)}
                                        disabled={savingEdit}
                                      >
                                        Annuler
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          setSavingEdit(true)
                                          await fetch('/api/contact-note/update', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              note_id: note.id,
                                              content: editingContent,
                                            }),
                                          })
                                          // Refetch notes
                                          const res = await fetch(`/api/contact/get?id=${appointment.contacts.id}`)
                                          const data = await res.json()
                                          setContactDetails(data)
                                          setEditingNoteId(null)
                                          setSavingEdit(false)
                                        }}
                                        disabled={savingEdit || isEditorContentEmpty(editingContent)}
                                      >
                                        {savingEdit ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                        Enregistrer
                                      </Button>
                                      
                                    </div>
                                  }
                                />
                              </div>
                            ) : (
                              <div
                                className={
                                  "prose prose-sm max-w-none text-foreground mt-1 pb-4 text-sm " +
                                  (idx !== notes.length - 1 ? "border-b" : "")
                                }
                                dangerouslySetInnerHTML={{ __html: note.content }}
                              />
                            )}
                          </div>
                          {/* 3 dots dropdown, visible au hover */}
                          {note.user_id === currentUserId && (
                            <div className="absolute right-2 top-2 flex items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition"
                                    aria-label="Ouvrir le menu"
                                    disabled={isEditing}
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingNoteId(note.id)
                                    setEditingContent(note.content)
                                  }}>Modifier</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive">Supprimer</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )})}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-muted border-t">
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