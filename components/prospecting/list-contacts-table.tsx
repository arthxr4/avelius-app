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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreHorizontal,
  Phone,
  Calendar,
  CalendarX,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddAppointmentDialog } from "@/components/prospecting/add-appointment-dialog"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export type SessionContact = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  status: string
  has_appointment: boolean
}

interface Props {
  clientId: string
  listId: string
}

const truncateText = (text: string, maxLength: number = 25) => {
  if (!text) return ""
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
}

export function ProspectingListContactsTable({ clientId, listId }: Props) {
  const [data, setData] = React.useState<SessionContact[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`/api/get-prospecting-list-contacts?list_id=${listId}`)
        if (!res.ok) throw new Error("Erreur lors de la récupération des contacts")
        const data = await res.json()
        setData(data)
      } catch (error) {
        console.error("Error:", error)
        toast.error("Erreur lors de la récupération des contacts")
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [listId])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns: ColumnDef<SessionContact>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "full_name",
      header: "Nom complet",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium capitalize w-[200px]">
            {row.original.first_name} {row.original.last_name}
          </div>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground w-[250px] truncate" title={row.original.email}>
            {row.original.email}
          </div>
        </div>
      ),
      size: 250,
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string
        if (!phone) return null
        return (
          <div className="w-[150px]">
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" />
              {phone}
            </a>
          </div>
        )
      },
      size: 150,
    },
    {
      accessorKey: "company",
      header: "Société",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-[200px] truncate" title={row.original.company}>
            {truncateText(row.original.company)}
          </div>
        </div>
      ),
      size: 200,
    },
    {
      id: "appointment_status",
      header: "Statut",
      cell: ({ row }) => {
        const contact = row.original
        const hasAppointment = contact.has_appointment

        return (
          <div className="w-[100px]">
            <Badge 
              variant="outline"
              className="flex items-center gap-1.5"
            >
              {hasAppointment ? (
                <>
                  <Calendar className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-muted-foreground">RDV pris</span>
                </>
              ) : (
                <>
                  <CalendarX className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-muted-foreground">Sans RDV</span>
                </>
              )}
            </Badge>
          </div>
        )
      },
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const contact = row.original

        return (
          <div className="flex justify-end w-[50px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!contact.has_appointment && (
                  <AddAppointmentDialog
                    clientId={clientId}
                    contact={contact}
                    listId={listId}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Ajouter un rendez-vous
                      </DropdownMenuItem>
                    }
                  />
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      size: 50,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[250px]" />
        </div>
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filtrer par email..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <ColumnsIcon className="mr-2 h-4 w-4" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
