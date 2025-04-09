"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateTimePicker24h } from "@/components/ui/date-time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

interface Session {
  id: string
  name: string
}

interface AddAppointmentDialogProps {
  clientId: string
  onAppointmentCreated: () => void
}

export function AddAppointmentDialog({ clientId, onAppointmentCreated }: AddAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Recherche de contacts
  useEffect(() => {
    const searchContacts = async () => {
      if (searchTerm.length < 2) {
        setContacts([])
        setShowCreateContact(false)
        return
      }

      try {
        const response = await fetch("/api/search-contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            search: searchTerm,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setContacts(data)
          setShowCreateContact(data.length === 0)
        }
      } catch (error) {
        console.error("Error searching contacts:", error)
        setContacts([])
      }
    }

    const debounce = setTimeout(searchContacts, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, clientId])

  // Récupération des sessions quand un contact est sélectionné
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedContact) {
        setSessions([])
        setSelectedSession(null)
        return
      }

      try {
        const response = await fetch("/api/get-contact-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            contact_id: selectedContact.id,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setSessions(data)
          
          // Présélectionner la session si une seule est disponible
          if (data.length === 1) {
            setSelectedSession(data[0].id)
          } else {
            setSelectedSession(null)
          }
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
        setSessions([])
        setSelectedSession(null)
      }
    }

    fetchSessions()
  }, [selectedContact, clientId])

  const handleCreateAppointment = async () => {
    if (!selectedContact || !date || !selectedSession) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/create-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          contact_id: selectedContact.id,
          session_id: selectedSession,
          date: date.toISOString(),
        }),
      })

      if (response.ok) {
        setOpen(false)
        onAppointmentCreated()
        // Reset form
        setSelectedContact(null)
        setDate(new Date())
        setSelectedSession(null)
        setSearchTerm("")
        setPopoverOpen(false)
      } else {
        const error = await response.json()
        console.error("Error creating appointment:", error)
        // TODO: Afficher un toast d'erreur
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      // TODO: Afficher un toast d'erreur
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Ajouter un rendez-vous
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau rendez-vous en sélectionnant un contact et une date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className={cn(
                    "justify-between",
                    !selectedContact && "text-muted-foreground"
                  )}
                >
                  {selectedContact ? (
                    `${selectedContact.first_name} ${selectedContact.last_name}`
                  ) : (
                    "Sélectionner un contact"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandEmpty>
                    {searchTerm.length < 2 ? (
                      "Entrez au moins 2 caractères..."
                    ) : showCreateContact ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          // TODO: Implémenter la création de contact
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un nouveau contact
                      </Button>
                    ) : (
                      "Aucun contact trouvé"
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-72">
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact.id}
                          value={`${contact.first_name} ${contact.last_name} ${contact.email} ${contact.phone} ${contact.company}`}
                          onSelect={() => {
                            setSelectedContact(contact)
                            setPopoverOpen(false)
                            setSearchTerm("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedContact?.id === contact.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>
                              {contact.first_name} {contact.last_name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {contact.company} • {contact.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <DateTimePicker24h
              date={date}
              setDate={setDate}
            />
          </div>

          <div className="grid gap-2">
            <Select
              value={selectedSession || ""}
              onValueChange={setSelectedSession}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  sessions.length === 0
                    ? "Aucune session disponible"
                    : "Sélectionner une session"
                } />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setSelectedContact(null)
              setSearchTerm("")
              setPopoverOpen(false)
              setSelectedSession(null)
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateAppointment}
            disabled={!selectedContact || !date || !selectedSession || isLoading}
          >
            {isLoading ? "Création..." : "Créer le rendez-vous"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 