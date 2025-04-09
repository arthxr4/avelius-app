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
import Papa from "papaparse"

const statusOptions = [
  { label: "Brouillon", value: "draft" },
  { label: "En cours", value: "in_progress" },
  { label: "Terminé", value: "done" },
]

const contactFields = ["first_name", "last_name", "email", "phone", "company"]

export function CreatePhoningSessionDialog({
  clientId,
  onCreated,
}: {
  clientId: string
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    status: "draft",
    date: new Date().toISOString().slice(0, 10),
  })
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data as any[])
        const headers = results.meta.fields || []
        const initialMapping: Record<string, string> = {}
        headers.forEach((header) => {
          if (contactFields.includes(header)) {
            initialMapping[header] = header
          } else {
            initialMapping[header] = ""
          }
        })
        setColumnMapping(initialMapping)
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📤 Soumission du formulaire...")
  
    const mappedContacts = csvData.map((row) => {
      const contact: Record<string, string> = {}
      for (const [csvCol, dbField] of Object.entries(columnMapping)) {
        if (dbField && dbField !== "__ignore__") {
          contact[dbField] = row[csvCol] || ""
        }
      }
      return contact
    })
  
    try {
      const res = await fetch("/api/create-phoning-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          client_id: clientId,
          contacts: mappedContacts,
        }),
      })
  
      console.log("📬 Réponse reçue :", res)
  
      const result = await res.json()
      console.log("📦 Résultat JSON :", result)
  
      if (!res.ok || !result.success) {
        toast.error(result?.error || "Erreur inconnue lors de la création")
        return
      }
  
      toast.success(
        `Session créée avec succès\n\n` +
        `${result.created_contacts} contacts créés\n` +
        `${result.existing_contacts} contacts déjà existants\n` +
        `${result.linked_contacts} liés à la session\n` +
        `${result.already_linked} déjà liés à cette session\n` +
        `${result.failed_contacts} erreurs`
      )
  
      setOpen(false)
      setForm({ title: "", status: "draft", date: new Date().toISOString().slice(0, 10) })
      setCsvFile(null)
      setCsvData([])
      setColumnMapping({})
      onCreated()
    } catch (err) {
      console.error("❌ Erreur catch :", err)
      toast.error("Une erreur est survenue")
    }

    // 💥 Laisser un peu de temps avant le toast
    setTimeout(() => {
      toast.success(
        `Session créée avec succès\n\n` +
        `${result.created_contacts} contacts créés\n` +
        `${result.existing_contacts} contacts déjà existants\n` +
        `${result.linked_contacts} liés à la session\n` +
        `${result.already_linked} déjà liés à cette session\n` +
        `${result.failed_contacts} erreurs`
      )
    }, 300)


  }
  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Créer une session</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle session de phoning</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Statut</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fichier CSV (prospects)</Label>
            <Input type="file" accept=".csv" onChange={handleFileChange} />
          </div>

          {csvData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Associer les colonnes :</h4>
              {Object.keys(columnMapping).map((csvCol) => (
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
                      <SelectItem value="__ignore__">Ignorer</SelectItem>
                      {contactFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="submit">Créer la session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
