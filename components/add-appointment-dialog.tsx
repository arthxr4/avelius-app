"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, X, AlertCircle, Loader2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
  onAppointmentCreated: (appointment: {
    id: string
    client_id: string
    contact_id: string
    status: string
    date: string
    contacts: {
      first_name: string
      last_name: string
      email: string
      phone: string
      company: string
    }
  }) => void
}

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis").refine((value) => {
    return /^[A-Za-zÀ-ÿ\-\s]{2,50}$/.test(value);
  }, {
    message: "Le prénom ne doit contenir que des lettres, tirets ou espaces",
  }),
  lastName: z.string().min(2, "Le nom est requis").refine((value) => {
    return value.length >= 2;
  }, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  email: z.string().refine((value) => {
    if (value === "") return true;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  }, {
    message: "Veuillez entrer une adresse email valide",
  }),
  company: z.string().refine((value) => {
    if (value === "") return true;
    return value.length >= 2 && /^[A-Za-zÀ-ÿ0-9\-\s&\.]{2,100}$/.test(value);
  }, {
    message: "Le nom de l'entreprise doit contenir au moins 2 caractères",
  }),
  phone: z.string().refine((value) => {
    if (value === "") return true;
    return /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(value);
  }, {
    message: "Veuillez entrer un numéro de téléphone français valide",
  }),
  listId: z.string().optional(),
}).refine((data) => {
  // Au moins un moyen de contact (email ou téléphone) doit être renseigné
  return data.email !== "" || data.phone !== "";
}, {
  message: "Veuillez renseigner au moins un email ou un numéro de téléphone",
  path: ["email"], // L'erreur s'affichera sous le champ email
})

export function AddAppointmentDialog({ clientId, onAppointmentCreated }: AddAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const [lists, setLists] = useState<ProspectingList[]>([])
  const [selectedList, setSelectedList] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isContactSaving, setIsContactSaving] = useState(false)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
    },
    mode: "onBlur",
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsContactSaving(true)
      let listId = values.listId
      if (lists.length === 0) {
        // Créer une liste par défaut
        const listResponse = await fetch("/api/create-prospecting-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            title: "Liste principale",
            date: new Date().toISOString().slice(0, 10),
            status: "pending",
            contacts: []
          })
        })
        if (listResponse.ok) {
          const newList = await listResponse.json()
          listId = newList.id
        } else {
          toast.error("Erreur lors de la création de la liste par défaut")
          setIsContactSaving(false)
          return
        }
      }
      const response = await fetch("/api/create-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          company: values.company,
          phone: values.phone,
          list_id: listId,
        }),
      })
      if (response.ok) {
        const newContact = await response.json()
        toast.success("Contact créé avec succès")
        setShowCreateContact(false)
        form.reset()
        setSelectedContact(null)
        // Rafraîchir la recherche pour inclure le nouveau contact
        const searchResponse = await fetch("/api/search-contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            search: values.firstName + " " + values.lastName,
          }),
        })
        if (searchResponse.ok) {
          const data = await searchResponse.json()
          setContacts(data)
        }
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la création du contact")
      }
    } catch (error) {
      console.error("Error creating contact:", error)
      toast.error("Une erreur est survenue lors de la création du contact")
    } finally {
      setIsContactSaving(false)
    }
  }

  // Recherche de contacts
  useEffect(() => {
    const searchContacts = async () => {
      try {
        console.log("Searching contacts with:", { clientId, searchTerm, popoverOpen })
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
          console.log("Search results:", data)
          setContacts(data)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error searching contacts:", response.status, errorData)
          setContacts([])
        }
      } catch (error) {
        console.error("Error searching contacts:", error)
        setContacts([])
      }
    }

    if (popoverOpen) {
      searchContacts()
    }
  }, [searchTerm, clientId, popoverOpen])

  // Réinitialiser la recherche et le formulaire quand le popover s'ouvre
  useEffect(() => {
    if (popoverOpen) {
      setSearchTerm("")
      setShowCreateContact(false)
    }
  }, [popoverOpen])

  // Récupération des listes quand un contact est sélectionné ou quand on crée un contact
  useEffect(() => {
    const fetchLists = async () => {
      try {
        let url = `/api/get-prospecting-lists?client_id=${clientId}`
        if (selectedContact) {
          url += `&contact_id=${selectedContact.id}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setLists(data)
          
          // Présélectionner la liste si une seule est disponible
          if (data.length === 1) {
            setSelectedList(data[0].id)
          } else {
            setSelectedList(undefined)
          }
        }
      } catch (error) {
        console.error("Error fetching lists:", error)
        setLists([])
        setSelectedList(undefined)
      }
    }

    // Charger les listes si un contact est sélectionné ou si on crée un contact
    if (selectedContact || showCreateContact) {
      fetchLists()
    } else {
      setLists([])
      setSelectedList(undefined)
    }
  }, [selectedContact, clientId, showCreateContact])

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
        const data = await response.json()
        setOpen(false)
        toast.success("Le rendez-vous a été créé avec succès")
        onAppointmentCreated(data)
        // Reset form
        setSelectedContact(null)
        setDate(new Date())
        setSelectedList(undefined)
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

  const formatPhoneNumber = (value: string) => {
    // Supprimer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '')
    // Ajouter des espaces tous les 2 chiffres
    return numbers.replace(/(\d{2})/g, '$1 ').trim()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="flex flex-col p-6 pb-11 gap-6">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Sélectionnez un contact et une date pour le rendez-vous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium leading-none">Contact</h4>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="font-normal w-full justify-between"
                    >
                      {selectedContact
                        ? `${selectedContact.first_name} ${selectedContact.last_name}`
                        : "Sélectionner un contact..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Rechercher par nom, prénom, email ou téléphone..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandEmpty>
                        {searchTerm.length > 0 && (
                          <p className="p-2 text-sm text-muted-foreground">
                            Aucun résultat trouvé.
                          </p>
                        )}
                      </CommandEmpty>
                      {searchTerm.length > 0 && (
                        <CommandItem
                          onSelect={() => {
                            setShowCreateContact(true)
                            setSelectedContact(null)
                            setPopoverOpen(false)
                          }}
                          className="flex items-center gap-2 px-4 py-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Ajouter {searchTerm}</span>
                        </CommandItem>
                      )}
                      {contacts.length > 0 && (
                        <CommandGroup heading="RÉSULTATS">
                          <ScrollArea className="h-[180px]">
                            {contacts.map((contact) => {
                              // Détermine si la recherche correspond au numéro de téléphone
                              const isPhoneSearch = searchTerm.replace(/\D/g, '').length > 0;
                              // Affiche le téléphone si c'est une recherche par téléphone ou si pas d'email
                              const displayPhone = isPhoneSearch || !contact.email;
                              
                              return (
                                <CommandItem
                                  key={contact.id}
                                  value={`${contact.first_name} ${contact.last_name} ${contact.email} ${contact.phone}`}
                                  onSelect={() => {
                                    setSelectedContact(contact)
                                    setPopoverOpen(false)
                                  }}
                                  className="flex items-center justify-between px-4 py-2"
                                >
                                  <div className="flex items-center gap-2 w-[calc(100%-2rem)]">
                                    <span className="font-medium min-w-fit">
                                      {contact.first_name} {contact.last_name}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate">
                                      {displayPhone ? contact.phone : contact.email}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      selectedContact?.id === contact.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              )
                            })}
                          </ScrollArea>
                        </CommandGroup>
                      )}
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Formulaire de création de contact */}
              {showCreateContact && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Nouveau contact</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateContact(false)
                        form.reset()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Prénom
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Florence" 
                                  className={cn(
                                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 bg-white",
                                    form.formState.errors.firstName && form.getFieldState("firstName").isTouched
                                      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                                      : "border-input focus-visible:border-ring focus-visible:ring-ring/50"
                                  )}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e)
                                    if (form.formState.errors.firstName) {
                                      form.trigger("firstName")
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage>
                                {form.formState.errors.firstName && form.getFieldState("firstName").isTouched && (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{form.formState.errors.firstName.message}</span>
                                  </div>
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Nom
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Martin" 
                                  className={cn(
                                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 bg-white",
                                    form.formState.errors.lastName && form.getFieldState("lastName").isTouched
                                      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                                      : "border-input focus-visible:border-ring focus-visible:ring-ring/50"
                                  )}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e)
                                    if (form.formState.errors.lastName) {
                                      form.trigger("lastName")
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage>
                                {form.formState.errors.lastName && form.getFieldState("lastName").isTouched && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{form.formState.errors.lastName.message}</span>
                                  </div>
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="florence.martin@example.fr" 
                                className={cn(
                                  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 bg-white",
                                  form.formState.errors.email && form.getFieldState("email").isTouched
                                    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                                    : "border-input focus-visible:border-ring focus-visible:ring-ring/50"
                                )}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  if (form.formState.errors.email) {
                                    form.trigger("email")
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage>
                              {form.formState.errors.email && form.getFieldState("email").isTouched && (
                                <div className="flex items-center gap-2 text-xs">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>{form.formState.errors.email.message}</span>
                                </div>
                              )}
                            </FormMessage>
                            {form.getFieldState("email").isTouched && 
                             form.getFieldState("phone").isTouched && 
                             !form.getValues("email") && 
                             !form.getValues("phone") && (
                              <div className="flex items-center gap-2 text-xs text-destructive mt-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>Veuillez renseigner au moins un email ou un numéro de téléphone</span>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Entreprise</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="ACME Sarl" 
                                  className={cn(
                                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 bg-white",
                                    form.formState.errors.company && form.getFieldState("company").isTouched
                                      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                                      : "border-input focus-visible:border-ring focus-visible:ring-ring/50"
                                  )}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e)
                                    if (form.formState.errors.company) {
                                      form.trigger("company")
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage>
                                {form.formState.errors.company && form.getFieldState("company").isTouched && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{form.formState.errors.company.message}</span>
                                  </div>
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel" 
                                  placeholder="06 12 34 56 78" 
                                  className={cn(
                                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 bg-white",
                                    form.formState.errors.phone && form.getFieldState("phone").isTouched
                                      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                                      : "border-input focus-visible:border-ring focus-visible:ring-ring/50"
                                  )}
                                  {...field}
                                  value={formatPhoneNumber(field.value)}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '')
                                    field.onChange(rawValue)
                                    if (form.formState.errors.phone) {
                                      form.trigger("phone")
                                    }
                                  }}
                                  maxLength={14}
                                />
                              </FormControl>
                              <FormMessage>
                                {form.formState.errors.phone && form.getFieldState("phone").isTouched && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{form.formState.errors.phone.message}</span>
                                  </div>
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                      {lists.length > 0 && (
                        <FormField
                          control={form.control}
                          name="listId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Liste associée
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une liste" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {lists.map((list) => (
                                    <SelectItem key={list.id} value={list.id}>
                                      {list.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="submit"
                          disabled={
                            isContactSaving ||
                            Object.keys(form.formState.errors).length > 0 ||
                            !form.getValues("firstName") ||
                            !form.getValues("lastName") ||
                            (lists.length > 0 && !form.getValues("listId")) ||
                            (form.getFieldState("email").isTouched && 
                             form.getFieldState("phone").isTouched && 
                             !form.getValues("email") && 
                             !form.getValues("phone"))
                          }
                        >
                          {isContactSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Enregistrement...</span>
                            </>
                          ) : (
                            "Enregistrer le contact"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium leading-none">Liste associée</h4>
                <Select
                  value={selectedList || ""}
                  onValueChange={setSelectedList}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une liste" />
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
                <h4 className="text-sm font-medium leading-none">Date et heure</h4>
                <DateTimePicker 
                  date={date} 
                  onSelect={(newDate) => newDate && setDate(newDate)}
                />
              </div>
            </div>
          </div>

         
        </div>
        <DialogFooter className="bg-muted border-t px-6 py-4 rounded-b-lg">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false)
                  setSelectedContact(null)
                  setDate(new Date())
                  setSelectedList(undefined)
                  setSearchTerm("")
                  setPopoverOpen(false)
                  form.reset()
                }}
                disabled={isLoading || isContactSaving || showCreateContact}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                onClick={handleCreateAppointment}
                disabled={
                  isLoading || 
                  isContactSaving || 
                  showCreateContact ||
                  (!selectedContact && !form.formState.isValid) || 
                  (selectedContact && !selectedList)
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  "Créer le rendez-vous"
                )}
              </Button>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 