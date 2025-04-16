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
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

interface ProspectingList {
  id: string
  title: string
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
  const [lists, setLists] = useState<ProspectingList[]>([])
  const [selectedList, setSelectedList] = useState<string | null>(null)
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

  // Récupération des listes quand un contact est sélectionné
  useEffect(() => {
    const fetchLists = async () => {
      if (!selectedContact) {
        setLists([])
        setSelectedList(null)
        return
      }

      try {
        const response = await fetch(`/api/get-prospecting-lists?client_id=${clientId}&contact_id=${selectedContact.id}`)
        if (response.ok) {
          const data = await response.json()
          setLists(data)
          
          // Présélectionner la liste si une seule est disponible
          if (data.length === 1) {
            setSelectedList(data[0].id)
          } else {
            setSelectedList(null)
          }
        }
      } catch (error) {
        console.error("Error fetching lists:", error)
        setLists([])
        setSelectedList(null)
      }
    }

    fetchLists()
  }, [selectedContact, clientId])

  const handleCreateAppointment = async () => {
    if (!selectedContact || !date) {
      toast.error("Veuillez sélectionner un contact et une date")
      return
    }

    setIsLoading(true)
    try {
      // Vérifier si un rendez-vous existe déjà
      const checkResponse = await fetch(`/api/check-appointment-exists?client_id=${clientId}&contact_id=${selectedContact.id}&date=${date.toISOString()}`)
      const checkData = await checkResponse.json()

      if (checkData.exists) {
        toast.error("Un rendez-vous existe déjà pour ce contact à cette date")
        setIsLoading(false)
        return
      }

      // Si pas de doublon, créer le rendez-vous
      const response = await fetch("/api/create-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          contact_id: selectedContact.id,
          list_id: selectedList,
          date: date.toISOString(),
        }),
      })

      if (response.ok) {
        setOpen(false)
        toast.success("Le rendez-vous a été créé avec succès")
        onAppointmentCreated()
        // Reset form
        setSelectedContact(null)
        setDate(new Date())
        setSelectedList(null)
        setSearchTerm("")
        setPopoverOpen(false)
      } else {
        const error = await response.json()
        console.error("Error creating appointment:", error)
        toast.error("Une erreur est survenue lors de la création du rendez-vous")
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast.error("Une erreur est survenue lors de la création du rendez-vous")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un rendez-vous
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
          <DialogDescription>
            Sélectionnez un contact et une date pour le rendez-vous.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Contact</h4>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedContact
                      ? `${selectedContact.first_name} ${selectedContact.last_name}`
                      : "Sélectionner un contact..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Rechercher un contact..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandEmpty>
                      {showCreateContact ? (
                        <p className="p-2 text-sm text-muted-foreground">
                          Aucun contact trouvé.
                        </p>
                      ) : (
                        <p className="p-2 text-sm text-muted-foreground">
                          Commencez à taper pour rechercher...
                        </p>
                      )}
                    </CommandEmpty>
                    {contacts.length > 0 && (
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {contacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={`${contact.first_name} ${contact.last_name}`}
                              onSelect={() => {
                                setSelectedContact(contact)
                                setPopoverOpen(false)
                              }}
                              className="flex items-center gap-3 px-4 py-2"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                <span className="text-sm font-medium">
                                  {contact.first_name[0]}
                                  {contact.last_name[0]}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {contact.first_name} {contact.last_name}
                                </span>
                                {contact.company && (
                                  <span className="text-sm text-muted-foreground">
                                    {contact.company}
                                  </span>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedContact?.id === contact.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium leading-none">Liste de prospection</h4>
              <Select
                value={selectedList || ""}
                onValueChange={setSelectedList}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    lists.length === 0
                      ? "Aucune liste disponible"
                      : "Sélectionner une liste"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium leading-none">Date et heure</h4>
              <DateTimePicker 
                date={date} 
                onSelect={(newDate) => newDate && setDate(newDate)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setSelectedContact(null)
                setDate(new Date())
                setSelectedList(null)
                setSearchTerm("")
                setPopoverOpen(false)
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              onClick={handleCreateAppointment}
              disabled={isLoading}
            >
              {isLoading ? "Création..." : "Créer le rendez-vous"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 