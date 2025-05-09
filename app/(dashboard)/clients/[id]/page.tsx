// ✅ PAGE app/(dashboard)/clients/[id]/page.tsx

"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Users, Calendar, UserX, TrendingUp, TrendingDown, Eye, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { AppointmentTable } from "@/components/appointment-table"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  startOfYear, 
  endOfYear, 
  format, 
  addWeeks, 
  isWithinInterval, 
  subMonths,
  addDays,
  differenceInDays
} from "date-fns"
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
import { DateRangePicker } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"

interface Analytics {
  totalAppointments: number
  totalProspects: number
  noShowRate: number
}

type TimeRange = "1m" | "3m" | "year"

interface DashboardData {
  appointments: Appointment[]
  contacts: Contact[]
  analytics: Analytics
  timeRanges: Record<TimeRange, { start: Date; end: Date }>
  client?: {
    company: string
  }
}

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
  trend,
  trendValue,
  description,
  icon: Icon,
  isLoading 
}: { 
  title: string
  value: string | number
  trend?: "up" | "down"
  trendValue?: string
  description?: string
  icon: React.ElementType
  isLoading: boolean
}) {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {isLoading ? <Skeleton className="h-8 w-20" /> : value}
        </CardTitle>
        {trendValue && (
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {trend === "up" ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {trendValue}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        {description && (
          <>
            <div className="line-clamp-1 flex gap-2 font-medium">
              {description} {trend === "up" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {isLoading ? <Skeleton className="h-4 w-40" /> : "Comparé au mois dernier"}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

const chartConfig = {
  appointments: {
    label: "Rendez-vous",
    color: "#fe490c",
    activeColor: "#fe490c",
  },
} satisfies ChartConfig

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "#fe490c" }} />
        <span className="font-medium">{payload[0]?.value} rendez-vous</span>
      </div>
    </div>
  )
}

// Fonction utilitaire pour calculer la différence de dates de manière sûre
function getDateDifference(dateRange: DateRange | undefined): number {
  if (!dateRange?.from || !dateRange?.to) return Infinity
  return differenceInDays(dateRange.to, dateRange.from)
}

function groupAppointmentsByPeriod(appointments: Appointment[], dateRange: DateRange) {
  if (!appointments.length || !dateRange?.from || !dateRange?.to) return []
  
  const daysDifference = getDateDifference(dateRange)
  const shouldGroupByDay = daysDifference <= 30

  if (shouldGroupByDay) {
    // Groupement par jour
    const days = []
    let currentDate = dateRange.from
    
    while (currentDate <= dateRange.to) {
      const appointmentsInDay = appointments.filter(app => {
        const creationDate = new Date(app.created_at)
        return format(creationDate, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
      })

      days.push({
        period: format(currentDate, "dd MMM", { locale: fr }),
        appointments: appointmentsInDay.length,
      })

      currentDate = addDays(currentDate, 1)
    }

    return days
  } else {
    // Groupement par semaine
    const weeks = []
    let currentDate = startOfWeek(dateRange.from, { locale: fr })
    const endDate = endOfWeek(dateRange.to, { locale: fr })

    while (currentDate <= endDate) {
      const weekEnd = endOfWeek(currentDate, { locale: fr })
      
      const appointmentsInWeek = appointments.filter(app => {
        const creationDate = new Date(app.created_at)
        return isWithinInterval(creationDate, { 
          start: currentDate, 
          end: weekEnd 
        })
      })

      weeks.push({
        period: format(currentDate, "dd MMM", { locale: fr }),
        appointments: appointmentsInWeek.length,
      })

      currentDate = addWeeks(currentDate, 1)
    }

    return weeks
  }
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
    .slice(0, 3)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Vos prochains rendez-vous</CardTitle>
        <CardDescription>Les 3 prochains rendez-vous à venir</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activeAppointments.length === 0 ? (
          <div className="flex h-[100px] items-center justify-center text-muted-foreground">
            Aucun rendez-vous actif
          </div>
        ) : (
          <div className="space-y-2">
            {activeAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {`${appointment.contacts.first_name.charAt(0)}${appointment.contacts.last_name.charAt(0)}`}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {appointment.contacts.first_name} {appointment.contacts.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.date), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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

export default function ClientOverview() {
  const params = useParams()
  const clientId = params.id as string
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<"upcoming" | "past">("upcoming")
  const [chartData, setChartData] = useState<{ period: string; appointments: number }[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  })

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  useEffect(() => {
    if (data?.appointments.length && dateRange?.from && dateRange?.to) {
      const filteredAppointments = data.appointments.filter(app => {
        const creationDate = new Date(app.created_at)
        return dateRange.from && dateRange.to && 
          creationDate >= dateRange.from && 
          creationDate <= dateRange.to
      })
      
      const newChartData = groupAppointmentsByPeriod(filteredAppointments, dateRange)
      setChartData(newChartData)
    }
  }, [data?.appointments, dateRange])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/get-client-dashboard?client_id=${clientId}`, {
          next: { revalidate: 60 }, // Cache pendant 1 minute
        })

        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }

        const dashboardData = await response.json()
        setData(dashboardData)
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
        setData(prev => prev ? {
          ...prev,
          appointments: prev.appointments.filter((app) => app.id !== appointmentId)
        } : null)
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
    setData(prev => prev ? {
      ...prev,
      appointments: prev.appointments.map((app) =>
        app.id === updatedAppointment.id ? { ...app, ...updatedAppointment } : app
      )
    } : null)
  }

  const now = new Date()
  const filteredAppointments = data?.appointments.filter((appointment) => {
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
  }) || []

  const quickLinks = [
    {
      title: "Rendez-vous",
      description: "Gérer vos rendez-vous et prospects",
      icon: Calendar,
      href: `/clients/${clientId}/meetings`
    },
    {
      title: "Details & Documents",
      description: "Accéder aux informations et documents",
      icon: FileText,
      href: `/clients/${clientId}/details`
    }
  ]

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Text and Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">Bienvenue Arthur !</h1>
          <p className="text-muted-foreground mt-1">Voici l'activité générée pour {data?.client?.company || "l'entreprise"}</p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={handleDateRangeChange}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Column */}
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnalyticsCard
              title="Total Rendez-vous"
              value={data?.analytics.totalAppointments || 0}
              trend="up"
              trendValue="+12.5%"
              description="Tendance à la hausse"
              icon={Calendar}
              isLoading={isLoading}
            />
            <AnalyticsCard
              title="Total Prospects"
              value={data?.analytics.totalProspects || 0}
              trend="down"
              trendValue="-20%"
              description="Acquisition en baisse"
              icon={Users}
              isLoading={isLoading}
            />
            <AnalyticsCard
              title="Taux de No-Show"
              value={`${data?.analytics.noShowRate.toFixed(1) || 0}%`}
              trend="up"
              trendValue="+12.5%"
              description="Rétention forte"
              icon={UserX}
              isLoading={isLoading}
            />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>
                  Rendez-vous créés {getDateDifference(dateRange) <= 30 ? "par jour" : "par semaine"}
                </CardTitle>
                <CardDescription>
                  {chartData.length > 0
                    ? `${chartData[0].period} - ${chartData[chartData.length - 1].period}`
                    : "Chargement..."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="h-[250px] w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        horizontal={true}
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickMargin={10}
                        fontSize={12}
                      />
                      <YAxis
                        width={20}
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
                        fill="#fe490c"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                        cursor="pointer"
                        activeBar={{
                          fill: "#fe490c",
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Appointments - Version plus compacte */}
          <ActiveAppointmentsList appointments={data?.appointments || []} isLoading={isLoading} />
        </div>

        {/* Secondary Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accès rapide</CardTitle>
              <CardDescription>Navigation rapide vers vos pages principales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quickLinks.map((link, i) => {
                  const Icon = link.icon
                  return (
                    <a
                      key={i}
                      href={link.href}
                      className="flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted"
                    >
                      <div className="rounded-lg border p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">{link.title}</h3>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
