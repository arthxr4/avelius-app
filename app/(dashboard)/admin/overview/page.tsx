"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, ListChecks, PhoneCall, TrendingUp, CalendarX, Target, TrendingDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"
import { useState, useEffect } from "react"
import { DateRangePicker } from "@/components/date-range-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Stats {
  appointments: {
    current: number
    previous: number
    change: number
  }
  clients: {
    current: number
    previous: number
    change: number
  }
  prospects: {
    current: number
    previous: number
    change: number
  }
  averageAppointments: {
    current: number
    previous: number
    change: number
  }
}

interface ChartData {
  date: string
  appointments: number
}

interface ContractStats {
  contract_id: string
  client_id: string
  client_name: string
  end_date: string
  days_remaining: number
  goal: number
  rdv_realised: number
  performance: number
  goal_status: 'En avance' | 'En retard'
  rdv_goal_delta: number
}

export default function AdminOverviewPage() {
  const router = useRouter()
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('daily')
  const [isLoading, setIsLoading] = useState(true)
  const [contractStats, setContractStats] = useState<ContractStats[]>([])

  const fetchData = async () => {
    try {
      if (!date?.from || !date?.to) return

      const response = await fetch(`/api/overview?from=${date.from.toISOString()}&to=${date.to.toISOString()}`)
      if (!response.ok) throw new Error('Failed to fetch data')
      const data = await response.json()
      setStats(data.stats)
      setChartData(data.chartData)
      setChartType(data.chartType)
      setContractStats(data.contractStats || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [date])

  const formatChange = (change: number | undefined | null) => {
    if (change === undefined || change === null) return "0.0"
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(1)}`
  }

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

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Vue d'ensemble</h1>
          <p className="text-muted-foreground">
            Tableau de bord des performances globales de l'agence
          </p>
        </div>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>

      {/* Section 1: KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rendez-vous</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.appointments?.current || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "..." : 
                `${formatChange(stats?.appointments?.change)}% vs période précédente`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.clients?.current || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "..." : 
                `${formatChange(stats?.clients?.change)}% vs période précédente`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects Ajoutés</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.prospects?.current || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "..." : 
                `${formatChange(stats?.prospects?.change)}% vs période précédente`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moy. RDV/Client</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.averageAppointments?.current || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "..." : 
                `${formatChange(stats?.averageAppointments?.change)}% vs période précédente`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des rendez-vous</CardTitle>
          <CardDescription>
            Nombre de rendez-vous {chartType === 'daily' ? 'par jour' : 'par semaine'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={true}
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
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
                    content={({ active, payload, label }) => {
                      if (!active || !payload) return null
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm font-medium">
                            {chartType === 'daily' ? 'Le ' : 'Semaine '}{label}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2563eb" }} />
                            <span className="font-medium">{payload[0]?.value} rendez-vous</span>
                          </div>
                        </div>
                      )
                    }}
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
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            <TrendingUp className="h-4 w-4" />
            Évolution des rendez-vous {chartType === 'daily' ? 'quotidiens' : 'hebdomadaires'}
          </div>
        </CardFooter>
      </Card>

      {/* Section 3: Contracts Table */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-medium">Performance des contrats</h2>
          <p className="text-sm text-muted-foreground">Vue d'ensemble des contrats clients et de leur performance</p>
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Fin de contrat</TableHead>
                <TableHead>Jours restants</TableHead>
                <TableHead>Objectif</TableHead>
                <TableHead>RDV réalisés</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractStats?.map((contract) => (
                <TableRow 
                  key={contract.contract_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/clients/${contract.client_id}`)}
                >
                  <TableCell className="font-medium">{contract.client_name}</TableCell>
                  <TableCell>{format(new Date(contract.end_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {contract.days_remaining} jours
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {contract.goal} RDV
                    </div>
                  </TableCell>
                  <TableCell>{contract.rdv_realised}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "gap-1",
                      contract.performance >= 100 
                        ? "text-green-500 border-green-500 bg-green-50" :
                      contract.performance >= 75 
                        ? "text-blue-500 border-blue-500 bg-blue-50" :
                      contract.performance >= 50 
                        ? "text-yellow-500 border-yellow-500 bg-yellow-50" :
                        "text-red-500 border-red-500 bg-red-50"
                    )}>
                      {contract.performance >= 100 ? <TrendingUp className="h-3 w-3" /> :
                       contract.performance >= 75 ? <ArrowUpCircle className="h-3 w-3" /> :
                       contract.performance >= 50 ? <Target className="h-3 w-3" /> :
                       <TrendingDown className="h-3 w-3" />}
                      {contract.performance}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "gap-1",
                      contract.goal_status === 'En avance' 
                        ? "text-green-500 border-green-500 bg-green-50"
                        : "text-red-500 border-red-500 bg-red-50"
                    )}>
                      {contract.goal_status === 'En avance' 
                        ? <ArrowUpCircle className="h-3 w-3" />
                        : <ArrowDownCircle className="h-3 w-3" />}
                      {contract.goal_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

