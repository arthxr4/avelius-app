// ✅ PAGE app/(dashboard)/clients/[id]/page.tsx

"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Users, Calendar, UserX, TrendingUp, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { AppointmentTable } from "@/components/appointment-table"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, format, addWeeks, isWithinInterval, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Appointment, Contact } from "@/types/appointment"

interface Analytics {
  totalAppointments: number
  totalProspects: number
  noShowRate: number
}

type TimeRange = "1m" | "3m" | "year"

function getDateRangeFromType(type: TimeRange): { start: Date; end: Date } {
  const now = new Date()
  const currentWeekEnd = endOfWeek(now, { locale: fr })
  
  switch (type) {
    case "1m":
      // 4 dernières semaines en incluant la semaine en cours
      return { 
        start: startOfWeek(subWeeks(currentWeekEnd, 3), { locale: fr }), 
        end: currentWeekEnd 
      }
    case "3m":
      // 3 derniers mois en incluant le mois en cours
      return { 
        start: startOfWeek(subMonths(now, 2), { locale: fr }), 
        end: currentWeekEnd 
      }
    case "year":
      // Année en cours
      return { 
        start: startOfYear(now), 
        end: endOfYear(now) 
      }
  }
}

function AnalyticsCard({ 
  title, 
  value, 
  icon: Icon,
  isLoading 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  )
}

const chartConfig = {
  appointments: {
    label: "Rendez-vous",
    color: "#2563eb",
    activeColor: "#1d4ed8",
  },
} satisfies ChartConfig

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2563eb" }} />
        <span className="font-medium">{payload[0]?.value} rendez-vous</span>
      </div>
    </div>
  )
}

function groupAppointmentsByWeek(appointments: Appointment[], timeRange: TimeRange) {
  if (!appointments.length) return []

  const { start, end } = getDateRangeFromType(timeRange)
  
  // Filtrer les rendez-vous dans la plage de dates en utilisant created_at
  const filteredAppointments = appointments.filter(app => {
    const creationDate = new Date(app.created_at)
    return isWithinInterval(creationDate, { start, end })
  })

  if (!filteredAppointments.length) return []

  // Nombre de semaines à afficher selon la plage
  const weeksToShow = timeRange === "1m" ? 4 : timeRange === "3m" ? 12 : 52
  
  // Créer un tableau de semaines
  const weeks = Array.from({ length: weeksToShow }, (_, i) => {
    const weekStart = addWeeks(startOfWeek(start, { locale: fr }), i)
    const weekEnd = addWeeks(weekStart, 1)
    
    const appointmentsInWeek = filteredAppointments.filter(app => {
      const creationDate = new Date(app.created_at)
      return isWithinInterval(creationDate, { start: weekStart, end: weekEnd })
    })

    return {
      week: format(weekStart, "dd MMM", { locale: fr }),
      appointments: appointmentsInWeek.length,
    }
  })

  return weeks
}

function getMaxYAxis(data: { appointments: number }[]) {
  const max = Math.max(...data.map(d => d.appointments))
  // On ajoute 20% pour avoir de l'espace au-dessus des barres
  return Math.ceil(max * 1.2)
}

function AppointmentDialog({ appointment }: { appointment: Appointment }) {
  const [status, setStatus] = useState(appointment.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const statusConfig = {
    confirmed: {
      label: "Confirmé",
      variant: "default" as const,
    },
    canceled: {
      label: "Annulé",
      variant: "destructive" as const,
    },
    reprogrammed: {
      label: "Reprogrammé",
      variant: "secondary" as const,
    },
    no_show: {
      label: "No-show",
      variant: "destructive" as const,
    },
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/update-appointment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: appointment.id,
          client_id: appointment.client_id,
          contact_id: appointment.contact_id,
          session_id: appointment.session_id,
          date: appointment.date,
          status: newStatus,
          added_by: appointment.added_by,
          created_at: appointment.created_at
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut")
      }

      setStatus(newStatus)
      toast.success("Le statut a été mis à jour")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Détails du rendez-vous</DialogTitle>
        <DialogDescription>
          Informations sur le contact et le rendez-vous
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          
          <div className="flex items-center gap-4 mb-4">
            
            <div>
              <p className="font-medium">{appointment.contacts.first_name} {appointment.contacts.last_name}</p>
              <p className="text-sm text-muted-foreground">{appointment.contacts.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium">{appointment.contacts.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entreprise</p>
              <p className="font-medium">{appointment.contacts.company}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Date et heure</p>
              <p className="font-medium">
                {format(new Date(appointment.date), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Statut actuel</p>
              <Badge variant={statusConfig[status as keyof typeof statusConfig]?.variant || "default"}>
                {statusConfig[status as keyof typeof statusConfig]?.label || status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Changer le statut</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={status === key ? config.variant : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(key)}
                    disabled={isUpdating || status === key}
                    className="w-full"
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

function ActiveAppointmentsList({ appointments, isLoading }: { 
  appointments: Appointment[], 
  isLoading: boolean 
}) {
  const activeAppointments = appointments
    .filter(app => ["confirmed", "rescheduled"].includes(app.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Vos prochains rendez-vous</CardTitle>
        <CardDescription>
          Validez vos rendez-vous passés
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : activeAppointments.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Aucun rendez-vous actif
          </div>
        ) : (
          <div className="space-y-6">
            {activeAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(appointment.contacts.first_name, appointment.contacts.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-medium">
                      {appointment.contacts.first_name} {appointment.contacts.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.date), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <AppointmentDialog appointment={appointment} />
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ClientDashboard() {
  const params = useParams()
  const clientId = params.id as string
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<"upcoming" | "past">("upcoming")
  const [chartData, setChartData] = useState<{ week: string; appointments: number }[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>("1m")

  // Mettre à jour les données du graphique quand les rendez-vous ou la plage de temps changent
  useEffect(() => {
    if (appointments.length > 0) {
      console.log("Appointments data:", appointments)
      console.log("First appointment created_at:", appointments[0].created_at)
      const data = groupAppointmentsByWeek(appointments, timeRange)
      console.log("Chart data:", data)
      setChartData(data)
    }
  }, [appointments, timeRange])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Récupérer les données en parallèle
        const [analyticsRes, appointmentsRes, contactsRes] = await Promise.all([
          fetch(`/api/get-analytics?client_id=${clientId}`, {
            next: { revalidate: 60 }, // Cache pendant 1 minute
          }),
          fetch(`/api/get-appointments?client_id=${clientId}`, {
            next: { revalidate: 60 }, // Cache pendant 1 minute
          }),
          fetch(`/api/get-contacts?client_id=${clientId}`, {
            next: { revalidate: 60 }, // Cache pendant 1 minute
          }),
        ])

        if (!analyticsRes.ok || !appointmentsRes.ok || !contactsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [analyticsData, appointmentsData, contactsData] = await Promise.all([
          analyticsRes.json(),
          appointmentsRes.json(),
          contactsRes.json(),
        ])

        console.log("Fetched appointments:", appointmentsData)
        setAnalytics(analyticsData)
        setAppointments(appointmentsData)
        setContacts(contactsData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  // Si l'ID du client n'est pas disponible, afficher un message d'erreur
  if (!params.id || typeof params.id !== 'string') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erreur</h2>
          <p className="text-muted-foreground">Impossible de charger les informations du client</p>
        </div>
      </div>
    )
  }

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
        throw new Error("Failed to delete appointment")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la suppression du rendez-vous")
    }
  }

  const handleUpdate = (updatedAppointment: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === updatedAppointment.id ? { ...app, ...updatedAppointment } : app
      )
    )
  }

  const now = new Date()
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date)
    return selectedView === "upcoming" 
      ? appointmentDate > now 
      : appointmentDate <= now
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return selectedView === "upcoming" 
      ? dateA - dateB
      : dateB - dateA
  })

  return (
    <div className="space-y-8">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <AnalyticsCard
          title="Total Rendez-vous"
          value={analytics?.totalAppointments || 0}
          icon={Calendar}
          isLoading={isLoading}
        />
        <AnalyticsCard
          title="Total Prospects"
          value={analytics?.totalProspects || 0}
          icon={Users}
          isLoading={isLoading}
        />
        <AnalyticsCard
          title="Taux de No-Show"
          value={`${analytics?.noShowRate.toFixed(1) || 0}%`}
          icon={UserX}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rendez-vous créés par semaine</CardTitle>
              <CardDescription>
                {chartData.length > 0
                  ? `${chartData[0].week} - ${chartData[chartData.length - 1].week}`
                  : "Chargement..."}
              </CardDescription>
            </div>
            <Select
              value={timeRange}
              onValueChange={(value: TimeRange) => setTimeRange(value)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent className="w-[220px]">
                <SelectItem value="1m">4 dernières semaines</SelectItem>
                <SelectItem value="3m">3 derniers mois</SelectItem>
                <SelectItem value="year">Année en cours</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="h-[350px] w-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="week"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickMargin={10}
                      fontSize={12}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      content={<CustomTooltip />}
                      wrapperStyle={{ zIndex: 1000 }}
                    />
                    <Bar
                      dataKey="appointments"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      cursor="pointer"
                      activeBar={{
                        fill: "#1d4ed8",
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <TrendingUp className="h-4 w-4" />
              Évolution des rendez-vous créés sur la période
            </div>
          </CardFooter>
      </Card>
        <ActiveAppointmentsList appointments={appointments} isLoading={isLoading} />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Rendez-vous</h2>
        <AppointmentTable
          data={filteredAppointments}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          selectedView={selectedView}
          onViewChange={(value: "upcoming" | "past") => setSelectedView(value)}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
