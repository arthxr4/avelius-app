import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import Papa from "papaparse"

interface Props {
  listId: string
  onImported?: () => void
}

interface Contact {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company?: string
}

export function ImportContactsDialog({ listId, onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    try {
      setLoading(true)

      const parsePromise = new Promise<Contact[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const contacts = results.data as Contact[]
            resolve(contacts)
          },
          error: (error) => reject(error),
        })
      })

      const contacts = await parsePromise

      // Validation des contacts
      const validContacts = contacts.filter((contact) => {
        const hasName = contact.first_name || contact.last_name
        const hasContact = contact.email || contact.phone
        return hasName && hasContact
      })

      if (validContacts.length === 0) {
        throw new Error("Aucun contact valide trouvé dans le fichier")
      }

      const res = await fetch("/api/import-prospecting-list-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_id: listId,
          contacts: validContacts,
        }),
      })

      if (!res.ok) throw new Error("Erreur lors de l'import des contacts")

      const data = await res.json()
      toast.success(
        `Import réussi : ${data.created_contacts} nouveaux contacts, ${data.existing_contacts} contacts existants`
      )
      setOpen(false)
      setFile(null)
      onImported?.()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de l'import des contacts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des contacts</DialogTitle>
          <DialogDescription>
            Importez des contacts depuis un fichier CSV.
            Les colonnes attendues sont : first_name, last_name, email, phone, company
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Import en cours..." : "Importer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 