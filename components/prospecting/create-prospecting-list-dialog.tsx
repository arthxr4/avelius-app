"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import Papa, { ParseResult } from "papaparse"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Contact {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}

const statusOptions = [
  { label: "En attente", value: "pending" },
  { label: "En cours", value: "in_progress" },
  { label: "Terminé", value: "done" },
]

const contactFields = [
  { value: "first_name", label: "Prénom" },
  { value: "last_name", label: "Nom" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Téléphone" },
  { value: "company", label: "Entreprise" },
  { value: "notes", label: "Notes" }
]

interface FormData {
  title: string
  description: string
}

export function CreateProspectingListDialog({
  clientId,
  onCreated,
}: {
  clientId: string
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
  })
  const [currentTab, setCurrentTab] = useState("details")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

  // Obtenir la liste des champs déjà mappés
  const getMappedFields = () => {
    return Object.values(columnMapping).filter(value => value && value !== "__ignore__")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    Papa.parse(file, {
      complete: (results: ParseResult<Record<string, string>>) => {
        setCsvData(results.data)
        
        // Reset mapping
        const headers = results.data[0] ? Object.keys(results.data[0]) : []
        const initialMapping: Record<string, string> = {}
        const usedFields = new Set<string>()
        
        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().trim()
          const matchingField = contactFields.find(field => 
            !usedFields.has(field.value) && 
            field.label.toLowerCase().includes(normalizedHeader)
          )
          
          if (matchingField) {
            initialMapping[header] = matchingField.value
            usedFields.add(matchingField.value)
          } else {
            initialMapping[header] = ""
          }
        })
        
        setColumnMapping(initialMapping)
      },
      header: true,
    })
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Le nom de la liste est requis")
      return
    }

    // Vérifier qu'au moins un contact est mappé si un fichier CSV est présent
    if (csvFile && !Object.values(columnMapping).some(v => v && v !== "__ignore__")) {
      toast.error("Veuillez associer au moins une colonne")
      return
    }

    try {
      setLoading(true)

      const contacts = csvData.length > 0 ? csvData.map((row) => {
        const contact: Contact = {}
        for (const [csvCol, dbField] of Object.entries(columnMapping)) {
          if (dbField && dbField !== "__ignore__") {
            contact[dbField as keyof Contact] = row[csvCol] || ""
          }
        }
        return contact
      }) : []

      const res = await fetch("/api/create-prospecting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: new Date().toISOString().split('T')[0],
          status: "pending",
          client_id: clientId,
          contacts: contacts,
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        console.error("Error:", error)
        toast.error("Erreur lors de la création de la liste")
        return
      }

      const result = await res.json()

      toast.success(
        `Liste créée avec succès\n\n` +
        `${result.created_contacts} nouveaux contacts\n` +
        `${result.existing_contacts} contacts existants\n` +
        `${result.linked_contacts} contacts liés à la liste`
      )

      setOpen(false)
      setFormData({
        title: "",
        description: "",
      })
      setCsvFile(null)
      setCsvData([])
      setColumnMapping({})
      setCurrentTab("details")
      onCreated()
    } catch (err) {
      console.error("Erreur:", err)
      toast.error("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = formData.title.trim() && 
    (csvData.length === 0 || Object.values(columnMapping).some(v => v && v !== "__ignore__"))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nouvelle liste</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0">
        <div className="flex flex-col p-6 pb-11 gap-6">
          <DialogHeader>
            <DialogTitle>Nouvelle liste de prospection</DialogTitle>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="import">Import CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nom de la liste</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-2">
                <Label>Fichier CSV</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground">
                  Format accepté : CSV
                </p>
              </div>

              {csvData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Association des colonnes</h4>
                    <p className="text-sm text-muted-foreground">
                      {csvData.length} contacts à importer
                    </p>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto pr-4 -mr-4">
                    <div className="grid gap-4">
                      {Object.keys(columnMapping).map((csvCol) => {
                        const usedFields = Object.values(columnMapping)
                        return (
                          <div key={csvCol} className="grid grid-cols-2 items-center gap-2">
                            <Label className="truncate">{csvCol}</Label>
                            <Select
                              value={columnMapping[csvCol]}
                              onValueChange={(value) =>
                                setColumnMapping((prev) => ({ ...prev, [csvCol]: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Associer à..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__ignore__">Ignorer cette colonne</SelectItem>
                                {contactFields.map((field) => (
                                  <SelectItem 
                                    key={field.value} 
                                    value={field.value}
                                    disabled={usedFields.includes(field.value) && columnMapping[csvCol] !== field.value}
                                  >
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="bg-muted border-t px-6 py-4 rounded-b-lg">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setFormData({
                  title: "",
                  description: "",
                })
                setCsvFile(null)
                setCsvData([])
                setColumnMapping({})
                setCurrentTab("details")
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !csvFile}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer la liste"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
