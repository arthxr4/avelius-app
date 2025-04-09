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
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddAppointmentDialog } from "@/components/phoning/add-appointment-dialog"

export type SessionContact = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

export interface Appointment {
  id: string
  contact_id: string
  status: string
  date: string
}

interface Props {
  data: SessionContact[]
  clientId: string
  sessionId: string
  appointments: Appointment[]
}

export function SessionContactsTable({ data, clientId, sessionId, appointments }: Props) {
  console.log("🔍 Component received appointments:", appointments?.length || 0)
  console.log("🔍 Component appointments data:", appointments)
  console.log("👥 Contacts data:", data)

  const appointmentsMap = React.useMemo(() => {
    console.log("🗺️ Creating appointments map from:", appointments)
    const map = new Map()
    if (Array.isArray(appointments)) {
      for (const rdv of appointments) {
        console.log("📌 Adding to map:", rdv.contact_id, rdv)
        map.set(rdv.contact_id, rdv)
      }
    }
    console.log("🗺️ Final map size:", map.size)
    return map
  }, [appointments])

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
    },
    {
      accessorKey: "first_name",
      header: "Prénom",
      cell: ({ row }) => <div className="capitalize">{row.original.first_name}</div>,
    },
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: ({ row }) => <div className="capitalize">{row.original.last_name}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.phone || "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "company",
      header: "Société",
      cell: ({ row }) => <div>{row.original.company}</div>,
    },
    {
        id: "rdv",
        header: "RDV",
        cell: ({ row }) => {
          const contact = row.original
          const appointment = appointmentsMap.get(contact.id)
  
          console.log("👤 Checking appointment for contact:", contact.id)
          console.log("📅 Found appointment:", appointment)
  
          if (appointment) {
            return (
              <Badge variant="default" className="text-xs">
                {appointment.status}
              </Badge>
            )
          }
  
          // Vérifier si un rendez-vous existe déjà pour ce contact dans ce client
          const hasExistingAppointment = Array.isArray(appointments) && appointments.some(
            (app) => {
              const matches = app.contact_id === contact.id
              console.log("🔍 Comparing:", { 
                contactId: contact.id, 
                appointmentContactId: app.contact_id,
                matches 
              })
              return matches
            }
          )
  
          console.log("✅ Has existing appointment:", hasExistingAppointment)
  
          if (hasExistingAppointment) {
            return (
              <Button 
                variant="outline" 
                size="sm" 
                disabled 
                className="text-xs"
                title="Un rendez-vous existe déjà pour ce contact"
              >
                RDV existant
              </Button>
            )
          }
  
          return (
            <AddAppointmentDialog
              contact={contact}
              clientId={clientId}
              sessionId={sessionId}
            />
          )
        },
      },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnVisibility,
      columnFilters,
      sorting,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Rechercher un prospect..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ColumnsIcon className="mr-2 h-4 w-4" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun prospect trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
