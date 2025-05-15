"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { AddClientDialog } from "@/components/clients/add-client-dialog"
import { ManageMembersDialog } from "@/components/clients/manage-members-dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreVerticalIcon,
  Eye,
  Trash,
  ArrowUpDown,
  UserCog,
  Building2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BadgePerso } from "@/components/ui/BadgePerso"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Client = {
  id: string
  name: string
  created_at: string
  created_by: string
  status: string
  members_count: number
  client_members?: {
    id: string
    user_email: string
    users: {
      first_name: string
      last_name: string
      email: string
      avatar_url: string | null
      status: string
      last_seen_at: string | null
    }
  }[]
}

export default function ClientsManagerPage() {
  const router = useRouter()
  const [data, setData] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [selectedClientsToDelete, setSelectedClientsToDelete] = React.useState<Client[]>([])

  const columns: ColumnDef<Client>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tout sélectionner"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Sélectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div className="text-xs font-medium">
            Client
          </div>
        )
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string
        return (
          <div className="text-sm font-medium pl-0 flex items-center gap-2 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-sm border bg-blue-50 text-blue-600 border-blue-200">
              <Building2 className="size-4" />
            </div>
            {name}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <div className="text-xs font-medium">
            Date de création
          </div>
        )
      },
      cell: ({ row }) => <div className="text-sm font-normal">{format(new Date(row.getValue("created_at")), "PPP", { locale: fr })}</div>,
    },
    {
      accessorKey: "members_count",
      header: ({ column }) => {
        return (
          <div className="text-xs font-medium">
            Membres
          </div>
        )
      },
      cell: ({ row }) => {
        const members = row.original.client_members || []
        const formatLastSeen = (date: string | null) => {
          if (!date) return "Jamais"
          const lastSeen = new Date(date)
          const now = new Date()
          const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
          
          if (diffInMinutes < 1) return "À l'instant"
          if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
          if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
          return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
        }

        return (
          <div className="flex -space-x-3">
            <TooltipProvider>
              {members.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      {member.users.avatar_url ? (
                        <img
                          src={member.users.avatar_url}
                          alt={`${member.users.first_name} ${member.users.last_name}`}
                          className="h-8 w-8 rounded-full border-2 border-background"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                          <span className="text-xs font-medium">
                            {`${member.users.first_name?.[0] || ''}${member.users.last_name?.[0] || ''}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium text-background">{`${member.users.first_name} ${member.users.last_name}`}</p>
                      <p className="text-xs text-muted-foreground">{member.users.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{member.users.status === "active" ? "Actif" : "En attente"}</span>
                        <span>•</span>
                        <span>{formatLastSeen(member.users.last_seen_at)}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <div className="text-xs font-medium">
            Statut
          </div>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        let badgeStatus: "Backlog" | "Planned" | "In Progress" | "Completed" | "Canceled" = "Backlog";
        switch (status) {
          case "active":
            badgeStatus = "Completed";
            break;
          case "inactive":
            badgeStatus = "Canceled";
            break;
          case "planned":
            badgeStatus = "Planned";
            break;
          case "in_progress":
            badgeStatus = "In Progress";
            break;
          case "backlog":
            badgeStatus = "Backlog";
            break;
        }
        return (
          <BadgePerso status={badgeStatus} />
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les détails
                </DropdownMenuItem>
                <ManageMembersDialog
                  clientId={client.id}
                  clientName={client.name}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Gérer les membres
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setClientToDelete(client)
                    setConfirmDelete("")
                  }}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const clientsResponse = await fetch("/api/get-clients")
        const clientsData = await clientsResponse.json()
        if (!clientsResponse.ok) throw new Error("Failed to fetch clients")
        const membersCountResponse = await fetch("/api/get-clients-members-count")
        const membersCountData = await membersCountResponse.json()
        if (!membersCountResponse.ok) throw new Error("Failed to fetch members count")
        const enrichedData = clientsData.map((client: Client) => ({
          ...client,
          members_count: membersCountData[client.id] || 0,
          client_members: client.client_members || []
        }))
        setData(enrichedData)
      } catch (error) {
        console.error("❌ Error:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDelete = async (clientId: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/delete-client?id=${clientId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setData((prev) => prev.filter((client) => client.id !== clientId))
        toast.success("Le client a été supprimé avec succès")
        setClientToDelete(null)
        setConfirmDelete("")
      } else {
        const error = await response.json()
        console.error("Erreur lors de la suppression:", error)
        toast.error("Erreur lors de la suppression du client")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du client")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true)
      for (const client of selectedClientsToDelete) {
        await handleDelete(client.id)
      }
      table.resetRowSelection()
      setSelectedClientsToDelete([])
    } catch (error) {
      console.error("Erreur lors de la suppression multiple:", error)
      toast.error("Erreur lors de la suppression des clients")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="sticky top-0 z-20 bg-background">
        <div className="flex items-center justify-between py-4 px-4 ">
          <div>
            <h1 className="text-xl font-bold">Clients</h1>
            <p className="text-sm text-muted-foreground">
              Ajouter, modifier ou supprimer un client.
            </p>
          </div>
          <AddClientDialog />
        </div>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Rechercher un client..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button 
                variant="destructive" 
                size="default"
                onClick={() => {
                  const selectedClients = table.getFilteredSelectedRowModel().rows.map(row => row.original)
                  setSelectedClientsToDelete(selectedClients)
                  const fakeClient: Client = {
                    id: 'multiple',
                    name: `${selectedClients.length} clients`,
                    created_at: '',
                    created_by: '',
                    status: '',
                    members_count: 0
                  }
                  setClientToDelete(fakeClient)
                  setConfirmDelete("")
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Supprimer la sélection
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <ColumnsIcon className="mr-2 h-4 w-4" />
                  Colonnes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" && column.getCanHide()
                  )
                  .map((column) => {
                    let columnLabel = column.id
                    switch (column.id) {
                      case "name":
                        columnLabel = "Client"
                        break
                      case "created_at":
                        columnLabel = "Date de création"
                        break
                      case "members_count":
                        columnLabel = "Membres"
                        break
                      case "status":
                        columnLabel = "Statut"
                        break
                    }
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-sm"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {columnLabel}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Trier par
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm" onClick={() => table.setSorting([{ id: "name", desc: false }])}>
                  Nom (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => table.setSorting([{ id: "name", desc: true }])}>
                  Nom (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => table.setSorting([{ id: "created_at", desc: false }])}>
                  Date de création (Plus récent)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => table.setSorting([{ id: "created_at", desc: true }])}>
                  Date de création (Plus ancien)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => table.setSorting([{ id: "members_count", desc: false }])}>
                  Membres (Croissant)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => table.setSorting([{ id: "members_count", desc: true }])}>
                  Membres (Décroissant)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="relative flex-1 overflow-auto">
        {loading ? (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="after:absolute after:left-0 after:right-0 after:bottom-0 after:border-b after:pointer-events-none">
                {/* Checkbox */}
                <th className="h-12 px-0 w-[48px] text-center align-middle">
                  <Skeleton className="mx-auto h-5 w-5 rounded" />
                </th>
                {/* Nom */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-20" />
                </th>
                {/* Date de création */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-16" />
                </th>
                {/* Membres */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-12" />
                </th>
                {/* Statut */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-12" />
                </th>
                {/* Actions */}
                <th className="h-12 px-2 text-right w-12">
                  <Skeleton className="h-4 w-6 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <tr key={i} className="h-12 border-b transition-colors hover:bg-muted/50">
                  {/* Checkbox */}
                  <td className="h-12 px-0 w-[48px] text-center align-middle">
                    <Skeleton className="mx-auto h-5 w-5 rounded" />
                  </td>
                  {/* Nom (avatar + texte) */}
                  <td className="h-12 px-2 text-left">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </td>
                  {/* Date de création */}
                  <td className="h-12 px-2 text-left">
                    <Skeleton className="h-4 w-16 rounded" />
                  </td>
                  {/* Membres (badge) */}
                  <td className="h-12 px-2 text-left">
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </td>
                  {/* Statut (badge) */}
                  <td className="h-12 px-2 text-left">
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </td>
                  {/* Actions (3 points) */}
                  <td className="h-12 px-2 text-right w-12">
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="after:absolute after:left-0 after:right-0 after:bottom-0 after:border-b after:pointer-events-none">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-2 text-left text-sm font-normal text-foreground bg-background bg-muted [&:has([role=checkbox])]:px-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:border-r-0 [&>[role=checkbox]]:translate-y-[2px]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50 h-10 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-blue-50/70"
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (
                        target.closest('input[type=\"checkbox\"]') ||
                        target.closest('[role=\"menuitem\"]') ||
                        target.closest('button')
                      ) {
                        return
                      }
                      router.push(`/admin/clients/${row.original.id}`)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-2 align-middle text-sm font-normal text-muted-foreground [&:has([role=checkbox])]:px-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:border-r-0 [&>[role=checkbox]]:translate-y-[2px]"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="h-8">
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center align-middle text-sm font-normal"
                  >
                    Aucun résultat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="sticky bottom-0 border-t bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-[100px]" />
            ) : table.getFilteredSelectedRowModel().rows.length > 0 ? (
              `${table.getFilteredSelectedRowModel().rows.length} client${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''} sélectionné${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''}`
            ) : (
              `${table.getFilteredRowModel().rows.length} client${table.getFilteredRowModel().rows.length > 1 ? 's' : ''} au total`
            )}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Lignes par page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} sur{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Première page</span>
                <ChevronsLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Page précédente</span>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Page suivante</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Dernière page</span>
                <ChevronsRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!clientToDelete} onOpenChange={(open) => {
        if (!open) {
          setClientToDelete(null)
          setConfirmDelete("")
          setSelectedClientsToDelete([])
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              {clientToDelete?.id === 'multiple' ? (
                <>Cette action est irréversible. Pour confirmer la suppression de <span className="font-medium">{selectedClientsToDelete.length} clients</span>, veuillez saisir "SUPPRIMER" ci-dessous.</>
              ) : (
                <>Cette action est irréversible. Pour confirmer la suppression de ce client, veuillez saisir "<span className="font-medium">{clientToDelete?.name}</span>" ci-dessous.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder={clientToDelete?.id === 'multiple' ? 'Saisir "SUPPRIMER"' : `Saisir "${clientToDelete?.name}"`}
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClientToDelete(null)
                setConfirmDelete("")
                setSelectedClientsToDelete([])
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => clientToDelete?.id === 'multiple' ? handleBulkDelete() : handleDelete(clientToDelete!.id)}
              disabled={(clientToDelete?.id === 'multiple' ? confirmDelete !== "SUPPRIMER" : confirmDelete !== clientToDelete?.name) || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 