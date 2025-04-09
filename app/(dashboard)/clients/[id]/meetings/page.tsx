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
import { CheckCircle2, Clock, XCircle, RefreshCcw, UserX } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AddAppointmentDialog } from "@/components/add-appointment-dialog"

type Contact = {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

type Appointment = {
  id: string
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

interface AppointmentTableProps {
  data: Appointment[]
  onDelete: (id: string) => void
  onUpdate: (appointment: Appointment) => void
  selectedView: "upcoming" | "past"
  onViewChange: (view: "upcoming" | "past") => void
  isLoading: boolean
}

function AppointmentTable({ 
  data, 
  onDelete, 
  onUpdate, 
  selectedView, 
  onViewChange, 
  isLoading 
}: AppointmentTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean
    appointmentId?: string
    appointmentDate?: string
  }>({
    isOpen: false,
  })

  const handleSearch = React.useCallback((value: string) => {
    setGlobalFilter(value)
  }, [])

  const fuzzyFilter: FilterFn<Appointment> = (row, columnId, value) => {
    const searchValue = String(value).toLowerCase()
    const contact = row.original.contacts

    // Recherche dans tous les champs spécifiés
    return (
      contact.first_name.toLowerCase().includes(searchValue) ||
      contact.last_name.toLowerCase().includes(searchValue) ||
      contact.email.toLowerCase().includes(searchValue) ||
      contact.phone.toLowerCase().includes(searchValue) ||
      contact.company.toLowerCase().includes(searchValue)
    )
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/update-appointment", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id: appointmentId, status: newStatus }),
      })

      if (response.ok) {
        const updatedAppointment = await response.json()
        onUpdate({ ...data.find(app => app.id === appointmentId)!, ...updatedAppointment })
        toast.success("Statut mis à jour avec succès")
      } else {
        const error = await response.json()
        console.error("Erreur lors de la mise à jour:", error)
        toast.error("Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorFn: (row) => row.contacts.first_name,
      id: "firstName",
      header: "Prénom",
      cell: ({ row }) => (
        <div 
          className="capitalize cursor-pointer hover:underline"
          onClick={() => {
            setSelectedAppointment(row.original)
            setDetailsOpen(true)
          }}
        >
          {row.original.contacts.first_name}
        </div>
      ),
    },
    {
      accessorFn: (row) => row.contacts.last_name,
      id: "lastName",
      header: "Nom",
      cell: ({ row }) => <div className="capitalize">{row.original.contacts.last_name}</div>,
    },
    {
      accessorFn: (row) => row.contacts.email,
      id: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.contacts.email}</div>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div>
          {format(new Date(row.original.date), "PPP 'à' HH'h'mm", { locale: fr })}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const config = getStatusConfig(row.original.status)
        const Icon = config.icon

        return (
          <Badge 
            variant="outline" 
            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
          >
            <Icon className={config.className} />
            {config.label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original
        const formattedDate = format(new Date(appointment.date), "PPP", { locale: fr })

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreVerticalIcon className="h-4 w-4" />
                <span className="sr-only">Menu actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAppointment(appointment)
                  setDetailsOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialog({
                  isOpen: true,
                  appointmentId: appointment.id,
                  appointmentDate: formattedDate,
                })}
              >
                <Trash className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      columnFilters,
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Rechercher par nom, email, société..."
            value={globalFilter ?? ""}
            onChange={(event) => handleSearch(event.target.value)}
            className="max-w-sm"
          />

          <div className="flex items-center justify-between">
            <Select
              value={selectedView}
              onValueChange={onViewChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Rendez-vous à venir</SelectItem>
                <SelectItem value="past">Rendez-vous passés</SelectItem>
              </SelectContent>
            </Select>

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
                    Aucun rendez-vous trouvé.
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

      <DeleteAppointmentDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={() => deleteDialog.appointmentId && onDelete(deleteDialog.appointmentId)}
        appointmentDate={deleteDialog.appointmentDate}
      />

      <AppointmentDetailsSheet
        appointment={selectedAppointment}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={onUpdate}
      />
    </>
  )
}

export default function MeetingsPage() {
  const params = useParams()
  const [data, setData] = React.useState<Appointment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedView, setSelectedView] = React.useState<"upcoming" | "past">("upcoming")

  React.useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(`/api/get-appointments?client_id=${params.id}`)
        const responseData = await response.json()
        
        if (response.ok) {
          setData(responseData)
        } else {
          console.error("❌ API Error:", responseData.error)
        }
      } catch (error) {
        console.error("❌ Fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

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
        setData((prev) => prev.filter((app) => app.id !== appointmentId))
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
    setData((prev) =>
      prev.map((app) =>
        app.id === updatedAppointment.id ? updatedAppointment : app
      )
    )
  }

  const now = new Date()
  const filteredAppointments = data.filter((appointment) => {
    const appointmentDate = new Date(appointment.date)
    return selectedView === "upcoming" 
      ? appointmentDate > now 
      : appointmentDate <= now
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return selectedView === "upcoming" 
      ? dateA - dateB  // Chronologique pour les rendez-vous à venir
      : dateB - dateA  // Anti-chronologique pour les rendez-vous passés
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {loading ? (
          <Skeleton className="h-8 w-[200px]" />
        ) : (
          <h2 className="text-2xl font-bold">Vos rendez-vous</h2>
        )}
        
        <AddAppointmentDialog
          clientId={params.id as string}
          onAppointmentCreated={() => {
            // Recharger les rendez-vous après la création
            setLoading(true)
            const fetchAppointments = async () => {
              try {
                const response = await fetch(`/api/get-appointments?client_id=${params.id}`)
                const responseData = await response.json()
                
                if (response.ok) {
                  setData(responseData)
                } else {
                  console.error("❌ API Error:", responseData.error)
                }
              } catch (error) {
                console.error("❌ Fetch error:", error)
              } finally {
                setLoading(false)
              }
            }
            fetchAppointments()
          }}
        />
      </div>

      <AppointmentTable
        data={filteredAppointments}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        selectedView={selectedView}
        onViewChange={(value) => setSelectedView(value)}
        isLoading={loading}
      />
    </div>
  )
}
