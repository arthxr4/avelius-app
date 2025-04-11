import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Pencil, Trash2, UserX, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export type Client = {
  id: string
  name: string
  domain?: string
  created_at: string
  manager_email?: string
  manager_status: string
}

interface ClientTableProps {
  clients: Client[]
  onDelete?: (id: string) => void
  onUpdate?: (client: Client) => void
}

export function ClientTable({
  clients,
  onDelete,
  onUpdate,
}: ClientTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Filtrer les clients en fonction de la recherche
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.domain?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (client.manager_email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedClient && onDelete) {
      onDelete(selectedClient.id)
      setDeleteDialogOpen(false)
      setSelectedClient(null)
    }
  }

  const handleRemoveManager = async (client: Client) => {
    try {
      const response = await fetch("/api/remove-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          clientId: client.id,
          managerEmail: client.manager_email 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression de l'accès")
      }

      toast.success("Accès du manager supprimé avec succès")
      window.location.reload()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression de l'accès")
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un client..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead className="w-[100px]">Statut</TableHead>
            <TableHead className="text-right w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {client.manager_email || "—"}
              </TableCell>
              <TableCell>
                {client.manager_email ? (
                  <Badge className="rounded-md text-muted-foreground flex items-center gap-1 px-1.5 text-xs" variant="outline">
                    {client.manager_status === "active" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-500 dark:text-green-400" />
                        Actif
                      </>
                    ) : client.manager_status === "invited" ? (
                      <>
                        <Clock className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                        Invité
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                        Inactif
                      </>
                    )}
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Ouvrir le menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUpdate?.(client)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    {client.manager_email && (
                      <DropdownMenuItem 
                        onClick={() => handleRemoveManager(client)}
                        className="text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Supprimer l'accès du manager
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDeleteClick(client)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le client
              {selectedClient?.name && ` "${selectedClient.name}"`} et toutes ses données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 