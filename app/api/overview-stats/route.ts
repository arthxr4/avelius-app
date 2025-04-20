import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json(
        { error: "Les dates 'from' et 'to' sont requises" },
        { status: 400 }
      )
    }

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

    // Calcul de la période précédente
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const periodLength = toDate.getTime() - fromDate.getTime()
    const previousFromDate = new Date(fromDate.getTime() - periodLength)
    const previousToDate = new Date(toDate.getTime() - periodLength)

    // Requêtes pour la période actuelle
    const [
      { data: currentAppointments },
      { data: currentClients },
      { data: currentContacts },
      { data: currentAppointmentsPerClient }
    ] = await Promise.all([
      // Total des rendez-vous
      supabase
        .from('appointments')
        .select('id')
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
        .lte('created_at', to)
    ])

    // Requêtes pour la période précédente
    const [
      { data: previousAppointments },
      { data: previousClients },
      { data: previousContacts },
      { data: previousAppointmentsPerClient }
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select('id')
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString()),

      supabase
        .from('clients')
        .select('id')
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString()),

      supabase
        .from('contacts')
        .select('id')
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString()),

      supabase
        .from('appointments')
        .select('client_id')
        .gte('created_at', previousFromDate.toISOString())
        .lte('created_at', previousToDate.toISOString())
    ])

    // Calcul des moyennes de RDV par client
    const currentUniqueClients = new Set(currentAppointmentsPerClient?.map(a => a.client_id) || []).size
    const previousUniqueClients = new Set(previousAppointmentsPerClient?.map(a => a.client_id) || []).size

    const currentAvgAppointments = currentUniqueClients ? 
      (currentAppointmentsPerClient?.length || 0) / currentUniqueClients : 0
    const previousAvgAppointments = previousUniqueClients ? 
      (previousAppointmentsPerClient?.length || 0) / previousUniqueClients : 0

    // Calcul des variations en pourcentage
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    const stats = {
      appointments: {
        current: currentAppointments?.length || 0,
        previous: previousAppointments?.length || 0,
        change: calculateChange(
          currentAppointments?.length || 0,
          previousAppointments?.length || 0
        )
      },
      clients: {
        current: currentClients?.length || 0,
        previous: previousClients?.length || 0,
        change: calculateChange(
          currentClients?.length || 0,
          previousClients?.length || 0
        )
      },
      prospects: {
        current: currentContacts?.length || 0,
        previous: previousContacts?.length || 0,
        change: calculateChange(
          currentContacts?.length || 0,
          previousContacts?.length || 0
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

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
} 