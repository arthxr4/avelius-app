"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
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
  FilterFn,
  Table as TableType,
  Row,
  Column,
} from "@tanstack/react-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreVerticalIcon,
  Eye,
  Trash,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCcw,
  UserX,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DeleteAppointmentDialog } from "@/components/delete-appointment-dialog"
import { AppointmentDetailsSheet } from "@/components/appointment-details-sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddAppointmentDialog } from "@/components/add-appointment-dialog"
import { Checkbox } from "@/components/ui/checkbox"

type Contact = {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

type Appointment = {
  id: string
  client_id: string
  contact_id: string
  status: string
  date: string
  contacts: Contact
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmé" },
  { value: "done", label: "Terminé" },
  { value: "canceled", label: "Annulé" },
  { value: "reprogrammed", label: "Reporté" },
  { value: "no_show", label: "Non présenté" },
]

const getStatusLabel = (status: string) => {
  return STATUS_OPTIONS.find(option => option.value === status)?.label || status
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "done":
      return {
        label: "Terminé",
        icon: CheckCircle2,
        className: "text-green-500 dark:text-green-400"
      }
    case "confirmed":
      return {
        label: "Confirmé",
        icon: Clock,
        className: "text-blue-500 dark:text-blue-400"
      }
    case "canceled":
      return {
        label: "Annulé",
        icon: XCircle,
        className: "text-red-500 dark:text-red-400"
      }
    case "reprogrammed":
      return {
        label: "Reporté",
        icon: RefreshCcw,
        className: "text-orange-500 dark:text-orange-400"
      }
    case "no_show":
      return {
        label: "Non présenté",
        icon: UserX,
        className: "text-red-500 dark:text-red-400"
      }
    default:
      return {
        label: status,
        icon: Clock,
        className: "text-muted-foreground"
      }
  }
}

type RowSelectionState = Record<string, boolean>

interface TableProps {
  data: Appointment[]
  isLoading: boolean
  onDelete: (id: string) => void
  onUpdate: (appointment: Appointment) => void
}

export function AppointmentTable({
  data,
  isLoading,
  onDelete,
  onUpdate,
}: TableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const handleDeleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDeleteDialogOpen(true)
  }

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = () => {
    table.getFilteredSelectedRowModel().rows.forEach(row => {
      onDelete(row.original.id)
    })
    table.resetRowSelection()
    setBulkDeleteDialogOpen(false)
  }

  const columns: ColumnDef<Appointment>[] = [
    {
      id: "select",
      header: ({ table }: { table: TableType<Appointment> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: Row<Appointment> }) => (
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
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-sm font-medium text-foreground hover:text-foreground/80 px-0"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"))
        return (
          <div className="flex flex-col">
            <div className="text-sm font-medium">
              {format(date, "d MMMM yyyy", { locale: fr })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(date, "HH:mm", { locale: fr })}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "contacts",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm font-medium text-foreground hover:text-foreground/80 px-0"
        >
          Contact
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }: { row: Row<Appointment> }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.contacts.first_name} {row.original.contacts.last_name}
        </div>
      ),
    },
    {
      accessorKey: "contacts.email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm font-medium text-foreground hover:text-foreground/80 px-0"
        >
          Email
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }: { row: Row<Appointment> }) => (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {row.original.contacts.email}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }: { row: Row<Appointment> }) => {
        const status = row.getValue("status") as string
        const statusConfig = getStatusConfig(status)
        const StatusIcon = statusConfig.icon
        return (
          <Badge variant="outline" className="inline-flex items-center gap-2 px-2 text-muted-foreground font-medium [&_svg]:size-3">
            <StatusIcon className={statusConfig.className} />
            {statusConfig.label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<Appointment> }) => {
        const appointment = row.original

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedAppointment(appointment)
                  setDetailsOpen(true)
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(appointment)}
                  className="text-destructive"
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleDeleteConfirm = async () => {
    if (!selectedAppointment) return

    try {
      await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "DELETE",
      })
      setDeleteDialogOpen(false)
      setSelectedAppointment(null)
      onDelete(selectedAppointment.id)
    } catch (error) {
      console.error("Error deleting appointment:", error)
    }
  }

  return (
    <div className="space-y-4 ">
      {(isLoading || table.getRowModel().rows?.length > 0) && (
        <>
          <div className=" overflow-hidden">
            <Table>
              <TableHeader className="">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="text-sm font-medium text-foreground">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-sm"
                    >
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (
                          target.closest('[role="checkbox"]') ||
                          target.closest('[role="menuitem"]') ||
                          target.closest('button')
                        ) {
                          return
                        }
                        setSelectedAppointment(row.original)
                        setDetailsOpen(true)
                      }}
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
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-[100px]" />
              ) : table.getFilteredSelectedRowModel().rows.length > 0 ? (
                `${table.getFilteredSelectedRowModel().rows.length} rendez-vous sélectionné${table.getFilteredSelectedRowModel().rows.length > 1 ? 's' : ''}`
              ) : (
                `${table.getFilteredRowModel().rows.length} rendez-vous`
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
        </>
      )}
      {!isLoading && !table.getRowModel().rows?.length && (
        <div className="flex h-[400px] items-center justify-center border-subtle border border-dashed rounded-md">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="rounded-full bg-muted p-6">
              <Calendar className="h-10 w-10 text-default" />
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
            <h3 className="font-semibold text-xl">Aucun rendez-vous</h3>
            <p className="text-mb text-muted-foreground">
              Vous n'avez pas de rendez-vous dans cette catégorie pour le moment.
            </p>
            </div>
          </div>
        </div>
      )}
      <DeleteAppointmentDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setSelectedAppointment(null)
        }}
        appointmentId={selectedAppointment?.id}
        appointmentDate={selectedAppointment?.date}
        onConfirm={handleDeleteConfirm}
      />
      <DeleteAppointmentDialog
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        appointmentCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleBulkDeleteConfirm}
      />
      <AppointmentDetailsSheet
        appointment={selectedAppointment}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={onUpdate}
      />
    </div>
  )
}

export default function MeetingsPage() {
  const params = useParams()
  const clientId = params.id as string
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [cache, setCache] = React.useState<Record<string, Appointment[]>>({})

  // Afficher le skeleton immédiatement
  React.useEffect(() => {
    setLoading(true)
  }, [params.id])

  const fetchAppointments = async () => {
    try {
      // Vérifier le cache
      if (cache[params.id as string]) {
        setAppointments(cache[params.id as string])
        setLoading(false)
        return
      }

      const response = await fetch(`/api/get-appointments?client_id=${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch appointments")
      
      const data = await response.json()
      setAppointments(data)
      setCache(prev => ({ ...prev, [params.id as string]: data }))
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast.error("Erreur lors du chargement des rendez-vous")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAppointments()
  }, [params.id])

  const handleDelete = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/delete-appointment?id=${appointmentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        setAppointments((prev) => prev.filter((app) => app.id !== appointmentId))
        toast.success("Le rendez-vous a été supprimé avec succès")
      } else {
        const error = await response.json()
        console.error("Erreur lors de la suppression:", error)
        toast.error("Erreur lors de la suppression du rendez-vous")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du rendez-vous")
    }
  }

  const handleUpdate = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === updatedAppointment.id ? updatedAppointment : app
      )
    )
  }

  const now = new Date()
  const upcomingAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date)
    return appointmentDate >= now && appointment.status !== "canceled"
  })
  const pastAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date)
    return appointmentDate < now && appointment.status !== "canceled"
  })
  const canceledAppointments = appointments.filter((appointment) => 
    appointment.status === "canceled"
  )

  return (
    <div className="space-y-4 p-2 sm:py-4 lg:px-6 pb-20 md:pb-4">
      <div className="flex items-center justify-between">
        <div className="">
          <h1 className="text-xl font-bold">Rendez-vous</h1>
          <p className="text-sm text-muted-foreground">
            Planifiez et gérez les rendez-vous avec vos contacts
          </p>
        </div>
        <AddAppointmentDialog 
          clientId={clientId}
          onAppointmentCreated={(newAppointment) => {
            setAppointments(prev => [...prev, newAppointment])
            if (cache[clientId]) {
              setCache(prev => ({
                ...prev,
                [clientId]: [...prev[clientId], newAppointment]
              }))
            }
          }}
        />
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-3">
            À venir <span className="rounded bg-muted text-muted-foreground group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600 px-1.5 py-0.5 text-xs transition-colors">{upcomingAppointments.length}</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-3">
            Passés <span className="rounded bg-muted text-muted-foreground group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600 px-1.5 py-0.5 text-xs transition-colors">{pastAppointments.length}</span>
          </TabsTrigger>
          <TabsTrigger value="canceled" className="group flex items-center gap-2 text-muted-foreground data-[state=active]:text-blue-600 hover:text-foreground transition-colors pb-3">
            Annulés <span className="rounded bg-muted text-muted-foreground group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600 px-1.5 py-0.5 text-xs transition-colors">{canceledAppointments.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <AppointmentTable
            data={upcomingAppointments}
            isLoading={loading}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </TabsContent>
        <TabsContent value="past">
          <AppointmentTable
            data={pastAppointments}
            isLoading={loading}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </TabsContent>
        <TabsContent value="canceled">
          <AppointmentTable
            data={canceledAppointments}
            isLoading={loading}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
