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
import { useCurrentClient } from "@/hooks/use-current-client"
import { type ProspectingList } from "@/lib/schemas/prospecting-list"
import { CreateProspectingListDialog } from "@/components/prospecting/create-prospecting-list-dialog"
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
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

export default function ProspectingListsPage() {
  const router = useRouter()
  const { current } = useCurrentClient()
  const [lists, setLists] = React.useState<ProspectingList[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<ProspectingList>[] = [
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
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs hover:bg-transparent p-0 h-auto font-normal pl-0"
          >
            Titre
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        return (
          <div className="font-medium pl-0">
            {title}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs hover:bg-transparent p-0 h-auto font-normal"
          >
            Date de création
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP", { locale: fr }),
    },
    {
      accessorKey: "contacts_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs hover:bg-transparent p-0 h-auto font-normal"
          >
            Contacts
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.getValue("contacts_count") || 0}
        </Badge>
      ),
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
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/clients/${current?.id}/prospecting-lists/${list.id}`)}>
                  Voir les contacts
                </DropdownMenuItem>
                <DropdownMenuItem>Supprimer la liste</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: lists,
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
  const fetchLists = async () => {
    try {
      setLoading(true)
      if (!current?.id) return
      const res = await fetch(`/api/get-prospecting-lists?client_id=${current.id}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Erreur lors de la récupération des listes")
      const data = await res.json()
      setLists(data)
    } catch (error) {
      console.error("❌ Erreur:", error)
        toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }
      fetchLists()
  }, [current?.id])

  if (!current) return null

  return (
    <div className="flex h-screen flex-col">
      <div className="sticky top-0 z-20 bg-background">
        <div className="flex items-center justify-between py-4 px-4">
          <div>
            <h1 className="text-md font-semibold">Listes de prospection</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos listes de prospects et suivez leur progression
          </p>
        </div>
          <CreateProspectingListDialog clientId={current.id} onCreated={() => {
            const fetchLists = async () => {
              try {
                setLoading(true)
                const res = await fetch(`/api/get-prospecting-lists?client_id=${current.id}`, {
                  credentials: "include",
                })
                if (!res.ok) throw new Error("Erreur lors de la récupération des listes")
                const data = await res.json()
                setLists(data)
              } catch (error) {
                console.error("❌ Erreur:", error)
                toast.error("Erreur lors du chargement des données")
              } finally {
                setLoading(false)
              }
            }
            fetchLists()
          }} />
      </div>
        <div className="px-4 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une liste..."
            className="pl-9"
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
          />
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
                {/* Titre */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-20" />
                </th>
                {/* Date de création */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-16" />
                </th>
                {/* Contacts */}
                <th className="h-12 px-2 text-left text-sm font-normal text-muted-foreground bg-background">
                  <Skeleton className="h-4 w-12" />
                </th>
                {/* Actions */}
                <th className="h-12 px-2 text-right w-12">
                  <Skeleton className="h-4 w-6 ml-auto" />
                </th>
              </tr>
            </thead>
          </table>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="after:absolute after:left-0 after:right-0 after:bottom-0 after:border-b after:pointer-events-none">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-2 text-left text-sm font-normal text-muted-foreground bg-background [&:has([role=checkbox])]:px-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:border-r-0 [&>[role=checkbox]]:translate-y-[2px]"
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
                        target.closest('input[type="checkbox"]') ||
                        target.closest('[role="menuitem"]') ||
                        target.closest('button')
                      ) {
                        return
                      }
                      router.push(`/clients/${current.id}/prospecting-lists/${row.original.id}`)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-2 align-middle text-sm font-normal [&:has([role=checkbox])]:px-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:border-r-0 [&>[role=checkbox]]:translate-y-[2px]"
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
              `${table.getFilteredSelectedRowModel().rows.length} liste${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''} sélectionnée${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''}`
            ) : (
              `${table.getFilteredRowModel().rows.length} liste${table.getFilteredRowModel().rows.length > 1 ? 's' : ''} au total`
            )}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
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
