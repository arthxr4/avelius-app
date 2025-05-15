// ✅ PAGE app/(dashboard)/clients/[id]/page.tsx

"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useUserData } from "@/lib/hooks/use-user-data"
import { Users, Calendar, UserX, TrendingUp, TrendingDown, Eye, FileText, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
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
  differenceInDays,
  subDays,
  isAfter,
  isBefore
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
import { AppointmentDetailsSheet } from "@/components/appointment-details-sheet"

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
  clientName?: string
  contract?: any
  period?: any
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
  icon: Icon,
  isLoading 
}: { 
  title: string
  value: string | number
  trend?: "up" | "down"
  trendValue?: string
  icon: React.ElementType
  isLoading: boolean
}) {
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null
  return (
    <Card className="@container/card p-4">
      <CardHeader className="flex flex-row items-center justify-between p-0 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{isLoading ? <Skeleton className="h-6 w-12" /> : value}</span>
            {trend && trendValue && TrendIcon && (
              <span className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                {trendValue}
              </span>
            )}
          </div>
        </div>
        
      </CardHeader>
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
        <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: "#2563eb" }} />
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

// ProgressCircle composant local
function ProgressCircle({ percent, label, value, goal }: { percent: number, label: string, value: number, goal: number }) {
  const radius = 62;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg height={radius * 2} width={radius * 2} className="block">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#2563eb"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
          style={{ transition: 'stroke-dashoffset 0.5s' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fontSize="1.75rem"
          fill="hsl(var(--foreground))"
          fontWeight="bold"
        >
          {`${progress.toFixed(0)}%`}
        </text>
      </svg>
      <div className="text-center">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{value} / {goal} réalisés</div>
      </div>
    </div>
  );
}

export default function ClientOverview() {
  const params = useParams()
  const clientId = params.id as string
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
  const { user, isLoading: isUserDataLoading } = useUserData()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<"upcoming" | "past">("upcoming")
  const [chartData, setChartData] = useState<{ period: string; appointments: number }[]>([])
  const today = new Date()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(today, 6),
    to: today
  })
  const [clientName, setClientName] = useState<string>("")
  const [contract, setContract] = useState<any>(null)
  const [period, setPeriod] = useState<any>(null)
  const [periodAppointments, setPeriodAppointments] = useState<number>(0)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Mémoriser la fonction de fetch pour éviter les rechargements inutiles
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      let url = `/api/get-client-dashboard?client_id=${clientId}`;
      if (dateRange?.from && dateRange?.to) {
        url += `&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`;
      }
      const response = await fetch(url, {
        next: { 
          revalidate: 60, // Revalider toutes les 60 secondes
          tags: [`client-${clientId}`] // Tag pour invalider le cache si nécessaire
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setClientName(dashboardData.clientName || "")
      setContract(dashboardData.contract || null)

      // Sélectionne la période en cours, sinon la plus récente passée, sinon la prochaine à venir
      let selectedPeriod = null;
      if (dashboardData.contract && dashboardData.contract.periods && dashboardData.contract.periods.length > 0) {
        const periods = dashboardData.contract.periods;
        const today = new Date();

        // 1. Période en cours (today entre start et end)
        selectedPeriod = periods.find((p: any) => {
          const start = new Date(p.period_start);
          const end = new Date(p.period_end);
          return start <= today && today <= end;
        });

        // 2. Sinon, la plus récente passée (celle dont end < today, la plus grande)
        if (!selectedPeriod) {
          selectedPeriod = periods
            .filter((p: any) => new Date(p.period_end) < today)
            .sort((a: any, b: any) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime())[0];
        }

        // 3. Sinon, la prochaine à venir (celle dont start > today, la plus petite)
        if (!selectedPeriod) {
          selectedPeriod = periods
            .filter((p: any) => new Date(p.period_start) > today)
            .sort((a: any, b: any) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())[0];
        }
      }
      setPeriod(selectedPeriod || dashboardData.period || null);

      // Calculer le nombre de RDV réalisés pour cette période
      if (selectedPeriod && dashboardData.appointments) {
        const start = new Date(selectedPeriod.period_start);
        const end = new Date(selectedPeriod.period_end);
        const rdvRealises = dashboardData.appointments.filter((app: any) => {
          const created = new Date(app.created_at);
          return created >= start && created <= end;
        }).length;
        setPeriodAppointments(rdvRealises);
      } else {
        setPeriodAppointments(0);
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [clientId, dateRange])

  // Mémoriser les rendez-vous filtrés
  const appointmentsList = useMemo(() => {
    if (!data?.appointments) return []
    
    const now = new Date()
    return data.appointments
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        return selectedView === "upcoming" 
          ? appointmentDate > now 
          : appointmentDate <= now
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return selectedView === "upcoming" 
          ? dateA - dateB
          : dateB - dateA
      })
  }, [data?.appointments, selectedView])

  // Mémoriser les 3 prochains rendez-vous
  const nextAppointments = useMemo(() => {
    if (!data?.appointments) return []
    
    return data.appointments
      .filter(app => new Date(app.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
  }, [data?.appointments])

  // Mémoriser les données du graphique
  const chartDataMemo = useMemo(() => {
    if (!data?.appointments.length || !dateRange?.from || !dateRange?.to) return []
    return groupAppointmentsByPeriod(data.appointments, dateRange)
  }, [data?.appointments, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setChartData(chartDataMemo)
  }, [chartDataMemo])

  // Calculer le nom d'affichage comme dans nav-user.tsx
  const displayName = user 
    ? `${user.first_name}`
    : `${clerkUser?.firstName || ""}`

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
  const filteredAppointments = appointmentsList

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

  // Placeholder pour la période en cours (à remplacer par la vraie logique plus tard)
  const currentPeriod = {
    label: "Objectif période en cours",
    percent: 65, // à remplacer par la vraie donnée
    value: 13,   // à remplacer par la vraie donnée
    goal: 20     // à remplacer par la vraie donnée
  }
  const hasCurrentPeriod = true // à remplacer par la vraie logique

  return (
    <div className="space-y-4 p-2 sm:py-4 lg:px-6 pb-20 md:pb-4">
      {/* Titre de la page en dehors des cards */}
      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-tight">
          Bienvenue {displayName || "l'entreprise"} !
        </h1>
        <p className="text-muted-foreground text-sm mb-2">
          Voici l'activité générée pour {clientName || "l'entreprise"}
        </p>
      </div>
      {/* Première ligne : analytics + objectif */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonne gauche : analytics + graph + date range picker dans une seule Card */}
        <div className="flex-1 flex flex-col h-full min-h-[480px]">
          <Card className="flex flex-col flex-1 h-full min-h-[480px]">
            <CardHeader>
              <div className="flex flex-row items-center justify-between gap-4 pb-2">
                <h2 className="text-xl font-semibold">Statistiques</h2>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                />
              </div>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                <AnalyticsCard
                  title="Total rendez-vous"
                  value={typeof data?.analytics?.totalAppointments === 'object' && data.analytics.totalAppointments !== null ? (data.analytics.totalAppointments as any).current : 0}
                  trend={typeof data?.analytics?.totalAppointments === 'object' && data.analytics.totalAppointments !== null && typeof (data.analytics.totalAppointments as any).change === 'number' ? ((data.analytics.totalAppointments as any).change > 0 ? 'up' : (data.analytics.totalAppointments as any).change < 0 ? 'down' : undefined) : undefined}
                  trendValue={typeof data?.analytics?.totalAppointments === 'object' && data.analytics.totalAppointments !== null && typeof (data.analytics.totalAppointments as any).change === 'number' ? `${(data.analytics.totalAppointments as any).change > 0 ? '+' : ''}${(data.analytics.totalAppointments as any).change.toFixed(1)}%` : ''}
                  icon={Calendar}
                  isLoading={isLoading}
                />
                <AnalyticsCard
                  title="Total prospects"
                  value={typeof data?.analytics?.totalProspects === 'object' && data.analytics.totalProspects !== null ? (data.analytics.totalProspects as any).current : 0}
                  trend={typeof data?.analytics?.totalProspects === 'object' && data.analytics.totalProspects !== null && typeof (data.analytics.totalProspects as any).change === 'number' ? ((data.analytics.totalProspects as any).change > 0 ? 'up' : (data.analytics.totalProspects as any).change < 0 ? 'down' : undefined) : undefined}
                  trendValue={typeof data?.analytics?.totalProspects === 'object' && data.analytics.totalProspects !== null && typeof (data.analytics.totalProspects as any).change === 'number' ? `${(data.analytics.totalProspects as any).change > 0 ? '+' : ''}${(data.analytics.totalProspects as any).change.toFixed(1)}%` : ''}
                  icon={Users}
                  isLoading={isLoading}
                />
                <AnalyticsCard
                  title="Taux de no-show"
                  value={typeof data?.analytics?.noShowRate === 'object' && data.analytics.noShowRate !== null && typeof (data.analytics.noShowRate as any).current === 'number' ? `${(data.analytics.noShowRate as any).current.toFixed(1)}%` : '0%'}
                  trend={typeof data?.analytics?.noShowRate === 'object' && data.analytics.noShowRate !== null && typeof (data.analytics.noShowRate as any).change === 'number' ? ((data.analytics.noShowRate as any).change > 0 ? 'up' : (data.analytics.noShowRate as any).change < 0 ? 'down' : undefined) : undefined}
                  trendValue={typeof data?.analytics?.noShowRate === 'object' && data.analytics.noShowRate !== null && typeof (data.analytics.noShowRate as any).change === 'number' ? `${(data.analytics.noShowRate as any).change > 0 ? '+' : ''}${(data.analytics.noShowRate as any).change.toFixed(1)}%` : ''}
                  icon={UserX}
                  isLoading={isLoading}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col justify-end">
              <div>
                <CardTitle className="text-base mb-2">
                  Rendez-vous créés {getDateDifference(dateRange) <= 30 ? "par jour" : "par semaine"}
                </CardTitle>
                <CardDescription className="mb-4">
                  {chartData.length > 0
                    ? `${chartData[0].period} - ${chartData[chartData.length - 1].period}`
                    : "Chargement..."}
                </CardDescription>
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
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Colonne droite : Contrat puis Objectif */}
        <div className="w-full lg:w-[340px] flex flex-col gap-4 max-w-md mx-auto h-full min-h-[480px]">
          {/* Card Contrat */}
          <Card className="w-full flex-1 flex flex-col min-h-0">
            {contract ? (
              <>
                <CardHeader className="pb-2 flex-shrink-0">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Contrat
                  </CardTitle>
                  <CardDescription>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm"><span>Début :</span> <span className="text-muted-foreground">{contract.start_date ? format(new Date(contract.start_date), 'dd MMM yyyy', { locale: fr }) : '-'}</span></span>
                      {contract.is_recurring && (
                        <span className="text-sm"><span>Récurrence :</span> <span className="text-muted-foreground">{contract.recurrence_every} {contract.recurrence_unit === 'month' ? 'mois' : contract.recurrence_unit === 'week' ? 'semaines' : contract.recurrence_unit === 'day' ? 'jours' : contract.recurrence_unit}</span></span>
                      )}
                      <span className="text-sm"><span>Objectif :</span> <span className="text-muted-foreground">{contract.default_goal} RDV / période</span></span>
                    </div>
                  </CardDescription>
                </CardHeader>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="font-medium mb-1">Aucun contrat actif</div>
                <div className="text-sm text-muted-foreground max-w-[200px]">
                  Les détails de votre contrat apparaîtront ici une fois configurés.
                </div>
              </div>
            )}
          </Card>
          {/* Card Objectif période en cours (même hauteur que Contrat) */}
          <Card className="w-full flex-1 flex flex-col min-h-0 h-1/2">
            {period ? (
              <>
                <CardHeader className="text-center pb-0 border-none flex-shrink-0">
                  <CardTitle className="text-lg font-semibold mb-0">Objectif période en cours</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {format(new Date(period.period_start), 'dd MMM yyyy', { locale: fr })} - {format(new Date(period.period_end), 'dd MMM yyyy', { locale: fr })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center flex-1">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4">
                      <ProgressCircle percent={period.goal > 0 ? Math.round((periodAppointments / period.goal) * 100) : 0} label="Objectif" value={periodAppointments} goal={period.goal} />
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="font-medium mb-1">Aucune période active</div>
                <div className="text-sm text-muted-foreground max-w-[200px]">
                  Vos objectifs et votre progression apparaîtront ici une fois configurés.
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Deuxième ligne : prochains rendez-vous (pleine largeur) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Prochains rendez-vous</h2>
            <p className="text-sm text-muted-foreground">Vos 3 prochains rendez-vous à venir</p>
          </div>
          <Button variant="outline" asChild>
            <a href={`/clients/${clientId}/meetings`}>
              Voir tous les rendez-vous
            </a>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nextAppointments.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-8 text-center text-muted-foreground border rounded-lg">
              <Calendar className="h-8 w-8 mb-2" />
              <div className="font-medium">Aucun rendez-vous à venir</div>
            </div>
          ) : (
            nextAppointments.map((appointment) => (
              <Card key={appointment.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {`${appointment.contacts.first_name.charAt(0)}${appointment.contacts.last_name.charAt(0)}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {appointment.contacts.first_name} {appointment.contacts.last_name}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">
                        {appointment.contacts.company}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium ">{format(new Date(appointment.date), "dd MMM yyyy", { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{format(new Date(appointment.date), "HH:mm", { locale: fr })}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSelectedAppointment(appointment)
                      setIsSheetOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      <AppointmentDetailsSheet
        appointment={selectedAppointment}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={(updatedAppointment) => {
          if (!data) return
          setData({
            ...data,
            appointments: data.appointments.map(app =>
              app.id === updatedAppointment.id ? {
                ...app,
                ...updatedAppointment,
                session_id: app.session_id,
                added_by: app.added_by,
                created_at: app.created_at
              } : app
            )
          })
        }}
      />

      {/* Troisième ligne : quick links (pleine largeur) */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold mb-1">Accès rapide</h2>
        <p className="text-muted-foreground text-sm mb-3">Navigation rapide vers vos pages principales</p>
        <div className="flex flex-col md:flex-row gap-4">
          {quickLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <a
                key={i}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors min-w-[220px]"
                style={{ flex: 1 }}
              >
                <div className="rounded-lg bg-muted p-2 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-base">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  )
}
