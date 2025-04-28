"use client"

import * as React from "react"
import { use } from "react"
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
import { useCurrentClient } from "@/hooks/use-current-client"
import { ImportContactsDialog } from "@/components/prospecting/import-contacts-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreVerticalIcon,
  ArrowUpDown,
  Search,
  Trash,
  Phone,
  Calendar,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RouteParams {
    id: string
  list_id: string
  }

interface Props {
  params: Promise<RouteParams>
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  position: string
  created_at: string
  status: string
  has_appointment?: boolean
  rdv?: boolean
  appointment?: boolean
}

export default function ProspectingListDetailsPage({ params: paramsPromise }: Props) {
  const params = use(paramsPromise) as RouteParams
  const router = useRouter()
  const { current } = useCurrentClient()
  const [loading, setLoading] = React.useState(true)
  const [list, setList] = React.useState<any>(null)
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const { id, list_id } = params

  const columns: ColumnDef<Contact>[] = [
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
      id: "full_name",
      header: () => <span>Nom complet</span>,
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.first_name} {row.original.last_name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: () => <span>Email</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: () => <span>Téléphone</span>,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "company",
      header: () => <span>Société</span>,
      cell: ({ row }) => (
        <span>{row.original.company}</span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span>Statut</span>,
      cell: ({ row }) => {
        const contact = row.original
        const hasRdv = contact.has_appointment || contact.rdv || contact.appointment || false
        return (
          <Badge variant="outline" className="inline-flex items-center gap-1">
            <Calendar className={`h-4 w-4 ${hasRdv ? 'text-green-600' : 'text-orange-600'}`} />
            {hasRdv ? 'RDV pris' : 'Sans RDV'}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Modifier</DropdownMenuItem>
                <DropdownMenuItem>Supprimer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: contacts,
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
    const fetchList = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/get-prospecting-list?id=${list_id}`)
        if (!res.ok) throw new Error("Erreur lors de la récupération de la liste")
        const data = await res.json()
        setList(data)
      } catch (error) {
        console.error("Error:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    const fetchContacts = async () => {
      try {
        const res = await fetch(`/api/get-prospecting-list-contacts?list_id=${list_id}`)
        if (!res.ok) throw new Error("Erreur lors de la récupération des contacts")
        const data = await res.json()
        setContacts(data)
      } catch (error) {
        console.error("Error:", error)
        toast.error("Erreur lors du chargement des contacts")
      }
    }

    if (list_id) {
      fetchList()
      fetchContacts()
    }
  }, [list_id])

  if (!current || !list) return null

  return (
    <div className="flex h-screen flex-col">
      <div className="sticky top-0 z-20 bg-background">
        <div className="flex items-center justify-between py-4 px-4">
      <div>
            <h1 className="text-md font-semibold">{list.title}</h1>
        <p className="text-sm text-muted-foreground">
              Gérez les contacts de votre liste de prospection
            </p>
          </div>
          <ImportContactsDialog listId={list_id} onImported={() => {
            const fetchContacts = async () => {
              try {
                setLoading(true)
                const res = await fetch(`/api/get-prospecting-list-contacts?list_id=${list_id}`)
                if (!res.ok) throw new Error("Erreur lors de la récupération des contacts")
                const data = await res.json()
                setContacts(data)
              } catch (error) {
                console.error("Error:", error)
                toast.error("Erreur lors du chargement des contacts")
              } finally {
                setLoading(false)
              }
            }
            fetchContacts()
          }} />
        </div>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Rechercher un contact..."
              value={(table.getColumn("first_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("first_name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  // TODO: Implement bulk delete
                  table.resetRowSelection()
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Supprimer la sélection
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto">
        {loading ? (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="after:absolute after:left-0 after:right-0 after:bottom-0 after:border-b after:pointer-events-none">
                {/* Checkbox */}
                <th className="h-12 px-0 w-[48px] text-center align-middle [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="mx-auto h-5 w-5 rounded" />
                </th>
                {/* Nom complet */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="h-4 w-20" />
                </th>
                {/* Email */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="h-4 w-24" />
                </th>
                {/* Téléphone */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="h-4 w-16" />
                </th>
                {/* Société */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="h-4 w-20" />
                </th>
                {/* Statut */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="h-4 w-12" />
                </th>
                {/* Actions */}
                <th className="h-12 px-2 text-right w-12 [&:has([role=checkbox])]:pl-4">
                  <Skeleton className="h-4 w-6 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <tr key={i} className="h-12 border-b transition-colors hover:bg-muted/50">
                  {/* Checkbox */}
                  <td className="h-12 px-0 w-[48px] text-center align-middle [&:has([role=checkbox])]:pl-4">
                    <Skeleton className="mx-auto h-5 w-5 rounded" />
                  </td>
                  {/* Nom complet */}
                  <td className="h-12 px-2 text-left [&:has([role=checkbox])]:pl-4">
                    <Skeleton className="h-4 w-20 rounded" />
                  </td>
                  {/* Email */}
                  <td className="h-12 px-2 text-left [&:has([role=checkbox])]:pl-4">
                    <Skeleton className="h-4 w-24 rounded" />
                  </td>
                  {/* Téléphone */}
                  <td className="h-12 px-2 text-left [&:has([role=checkbox])]:pl-4">
                    <Skeleton className="h-4 w-16 rounded" />
                  </td>
                  {/* Société */}
                  <td className="h-12 px-2 text-left [&:has([role=checkbox])]:pl-4">
                    <Skeleton className="h-4 w-20 rounded" />
                  </td>
                  {/* Statut */}
                  <td className="h-12 px-2 text-left [&:has([role=checkbox])]:pl-4">
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </td>
                  {/* Actions */}
                  <td className="h-12 px-2 text-right w-12 [&:has([role=checkbox])]:pl-4">
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
                      className="h-10 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:px-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:border-r-0 [&>[role=checkbox]]:translate-y-[2px] [&:has([role=checkbox])]:pl-4"
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
                    className="cursor-pointer hover:bg-muted/50 h-10 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-blue-50/70 [&:has([role=checkbox])]:pl-4"
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (
                        target.closest('input[type="checkbox"]') ||
                        target.closest('[role="menuitem"]') ||
                        target.closest('button')
                      ) {
                        return
                      }
                      // TODO: Navigate to contact details
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-2 align-middle text-sm font-normal [&:has([role=checkbox])]:px-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:border-r-0 [&>[role=checkbox]]:translate-y-[2px] [&:has([role=checkbox])]:pl-4"
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
                    className="h-24 text-center align-middle text-sm font-normal [&:has([role=checkbox])]:pl-4"
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
              `${table.getFilteredSelectedRowModel().rows.length} contact${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''} sélectionné${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''}`
            ) : (
              `${table.getFilteredRowModel().rows.length} contact${table.getFilteredRowModel().rows.length > 1 ? 's' : ''} au total`
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
    </div>
  )
}
