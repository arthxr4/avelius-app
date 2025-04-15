"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, MoreVertical, Pencil, Trash } from "lucide-react"
import { type ProspectingList } from "@/lib/schemas/prospecting-list"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateProspectingListDialog } from "@/components/prospecting/create-prospecting-list-dialog"

interface ProspectingTableProps {
  data: ProspectingList[]
  clientId: string
  onCreated: () => void
}

export function ProspectingTable({ data, clientId, onCreated }: ProspectingTableProps) {
  const router = useRouter()
  const [editingList, setEditingList] = useState<ProspectingList | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDelete = async (list: ProspectingList) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette liste ?")) return

    try {
      const res = await fetch(`/api/delete-prospecting-list?id=${list.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Erreur lors de la suppression")

      toast.success("Liste supprimée")
      onCreated()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingList || !newTitle.trim()) return

    try {
      setLoading(true)
      const res = await fetch(`/api/update-prospecting-list?id=${editingList.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      })

      if (!res.ok) throw new Error("Erreur lors de la modification")

      toast.success("Liste modifiée")
      setEditingList(null)
      onCreated()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la modification")
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<ProspectingList>[] = [
    {
      accessorKey: "title",
      header: "Titre",
    },
    {
      accessorKey: "created_at",
      header: "Date de création",
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP", { locale: fr }),
    },
    {
      accessorKey: "contacts_count",
      header: "Contacts",
      cell: ({ row }) => {
        const count = row.getValue("contacts_count")
        return count || 0
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const list = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/clients/${clientId}/prospecting-lists/${list.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingList(list)
                    setNewTitle(list.title)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier le nom
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(list)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.dropdown-menu')) return
                    router.push(`/clients/${clientId}/prospecting-lists/${row.original.id}`)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucune liste trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le nom de la liste</DialogTitle>
            <DialogDescription>
              Entrez le nouveau nom de la liste de prospection.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nouveau nom"
              disabled={loading}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading || !newTitle.trim()}>
                {loading ? "Modification..." : "Modifier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
