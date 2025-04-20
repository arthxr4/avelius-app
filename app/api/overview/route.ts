import { createClient } from '@supabase/supabase-js'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { addDays, format, subDays, startOfWeek, endOfWeek, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ContractPeriod {
  id: string
  period_start: string
  period_end: string
  goal: number
  contract_id: string
  client_contracts: {
    client_id: string
    clients: {
      name: string
    }
  }
}

interface AppointmentsByPeriod {
  period_id: string
  appointments: Array<{
    id: string
    created_at: string
  }>
}

export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Créer le client Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer les paramètres de date
    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    if (!from || !to) {
      return new Response(JSON.stringify({ error: 'Missing date parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)
    const today = new Date()

    // Requêtes pour la période actuelle
    const [
      { data: currentAppointments },
      { data: currentClients },
      { data: currentContacts },
      { data: currentAppointmentsPerClient },
      { data: activeContractPeriods, error: periodsError }
    ] = await Promise.all([
      // Total des rendez-vous
      supabase
        .from('appointments')
        .select('id, created_at')
        .gte('created_at', from)
        .lte('created_at', to),

      // Nombre de clients
      supabase
        .from('clients')
        .select('id')
        .gte('created_at', from)
        .lte('created_at', to),

      // Nombre de prospects (contacts)
      supabase
        .from('contacts')
        .select('id')
        .gte('created_at', from)
        .lte('created_at', to),

      // Moyenne RDV par client
      supabase
        .from('appointments')
        .select('client_id')
        .gte('created_at', from)
        .lte('created_at', to),

      // Périodes de contrat actives
      supabase
        .from('contract_periods')
        .select(`
          id,
          period_start,
          period_end,
          goal,
          contract_id,
          client_contracts!inner (
            client_id,
            clients (
              id,
              name
            )
          )
        `)
        .lte('period_start', today.toISOString())
        .gte('period_end', today.toISOString())
        .order('period_start', { ascending: false })
    ])

    if (periodsError) {
      console.error('Error fetching contract periods:', periodsError)
      throw periodsError
    }

    // Récupérer les rendez-vous pour chaque période
    const appointmentsPromises = activeContractPeriods?.map(async (period) => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, created_at')
        .eq('client_id', period.client_contracts.client_id)
        .gte('created_at', period.period_start)
        .lte('created_at', period.period_end)

      return {
        period_id: period.id,
        appointments: appointments || []
      }
    }) || []

    const appointmentsByPeriod = await Promise.all(appointmentsPromises)

    // Garder uniquement la période la plus récente pour chaque client
    const latestPeriodsByClient = activeContractPeriods?.reduce((acc, period) => {
      const clientId = period.client_contracts.client_id
      if (!acc[clientId] || new Date(acc[clientId].period_start) < new Date(period.period_start)) {
        acc[clientId] = period
      }
      return acc
    }, {} as Record<string, any>)

    // Calculer les statistiques pour chaque période
    const contractStats = Object.values(latestPeriodsByClient || {}).map((period: any) => {
      const periodAppointments = appointmentsByPeriod.find(a => a.period_id === period.id)?.appointments || []
      const totalDays = (new Date(period.period_end).getTime() - new Date(period.period_start).getTime()) / (1000 * 60 * 60 * 24)
      const daysElapsed = Math.min(
        (new Date().getTime() - new Date(period.period_start).getTime()) / (1000 * 60 * 60 * 24),
        totalDays
      )
      const daysRemaining = Math.max(0, Math.round(totalDays - daysElapsed))
      const performance = period.goal > 0 ? Math.round((periodAppointments.length / period.goal) * 100) : 0
      
      return {
        contract_id: period.contract_id,
        client_id: period.client_contracts.client_id,
        client_name: period.client_contracts.clients.name,
        end_date: period.period_end,
        days_remaining: daysRemaining,
        goal: period.goal,
        rdv_realised: periodAppointments.length,
        performance: performance,
        goal_status: performance >= 100 ? 'En avance' : 'En retard',
        rdv_goal_delta: periodAppointments.length - period.goal
      }
    })

    // Calcul des moyennes de RDV par client
    const currentUniqueClients = new Set(currentAppointmentsPerClient?.map(a => a.client_id) || []).size
    const previousUniqueClients = new Set(appointmentsByPeriod.map(a => a.client_id) || []).size

    const currentAvgAppointments = currentUniqueClients ? 
      (currentAppointmentsPerClient?.length || 0) / currentUniqueClients : 0
    const previousAvgAppointments = previousUniqueClients ? 
      (appointmentsByPeriod.length || 0) / previousUniqueClients : 0

    // Calcul des variations en pourcentage
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    const stats = {
      appointments: {
        current: currentAppointments?.length || 0,
        previous: appointmentsByPeriod.length || 0,
        change: calculateChange(
          currentAppointments?.length || 0,
          appointmentsByPeriod.length || 0
        )
      },
      clients: {
        current: currentClients?.length || 0,
        previous: previousUniqueClients,
        change: calculateChange(
          currentClients?.length || 0,
          previousUniqueClients
        )
      },
      prospects: {
        current: currentContacts?.length || 0,
        previous: currentContacts?.length || 0,
        change: calculateChange(
          currentContacts?.length || 0,
          currentContacts?.length || 0
        )
      },
      averageAppointments: {
        current: Number(currentAvgAppointments.toFixed(1)),
        previous: Number(previousAvgAppointments.toFixed(1)),
        change: calculateChange(
          currentAvgAppointments,
          previousAvgAppointments
        )
      }
    }

    // Préparer les données du graphique
    const chartData = []
    const currentDate = new Date(fromDate)
    const daysDifference = differenceInDays(toDate, fromDate)
    const shouldGroupByWeek = daysDifference > 30

    if (shouldGroupByWeek) {
      // Grouper par semaine
      while (currentDate <= toDate) {
        const weekStart = startOfWeek(currentDate, { locale: fr })
        const weekEnd = endOfWeek(currentDate, { locale: fr })
        
        const appointmentsInWeek = currentAppointments?.filter(a => {
          const appointmentDate = new Date(a.created_at)
          return appointmentDate >= weekStart && appointmentDate <= weekEnd
        }) || []

        chartData.push({
          date: `S${format(weekStart, 'w', { locale: fr })}`,
          appointments: appointmentsInWeek.length
        })

        // Avancer à la semaine suivante
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else {
      // Grouper par jour (comportement existant)
      while (currentDate <= toDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd')
        const appointmentsForDate = currentAppointments?.filter(
          a => format(new Date(a.created_at), 'yyyy-MM-dd') === dateStr
        ) || []
        
        chartData.push({
          date: format(currentDate, 'dd/MM'),
          appointments: appointmentsForDate.length
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return new Response(JSON.stringify({
      stats,
      chartData,
      chartType: shouldGroupByWeek ? 'weekly' : 'daily',
      contractStats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching overview data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 