import { createClient } from '@supabase/supabase-js'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { startOfWeek, endOfWeek, subMonths, startOfYear, endOfYear } from 'date-fns'
import { fr } from 'date-fns/locale'

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

    // Récupérer le client_id depuis l'URL
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Missing client_id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Récupérer les paramètres de date
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    let fromDate = from ? new Date(from) : subMonths(new Date(), 1)
    let toDate = to ? new Date(to) : new Date()

    // Calcul de la période précédente (même durée)
    const durationMs = toDate.getTime() - fromDate.getTime()
    const prevToDate = new Date(fromDate.getTime() - 1)
    const prevFromDate = new Date(prevToDate.getTime() - durationMs)

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

    // Récupérer toutes les données en parallèle pour les deux périodes
    const [
      { data: appointments },
      { data: contacts },
      { data: noShowAppointments },
      { data: totalAppointmentsCurrent },
      { data: totalProspectsCurrent },
      { data: totalAppointmentsPrev },
      { data: totalProspectsPrev },
    ] = await Promise.all([
      // Tous les rendez-vous du client (pour affichage complet)
      supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          contact_id,
          date,
          status,
          added_by,
          created_at,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone,
            company
          )
        `)
        .eq('client_id', clientId)
        .order('date', { ascending: true }),

      // Tous les contacts du client (pour affichage complet)
      supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId),

      // Rendez-vous "no-show" sur toute la période (pour affichage complet)
      supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', 'no_show'),

      // Total des rendez-vous sur la période sélectionnée
      supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString()),

      // Total des prospects (contacts) sur la période sélectionnée
      supabase
        .from('contacts')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString()),

      // Total des rendez-vous sur la période précédente
      supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', prevFromDate.toISOString())
        .lte('created_at', prevToDate.toISOString()),

      // Total des prospects (contacts) sur la période précédente
      supabase
        .from('contacts')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', prevFromDate.toISOString())
        .lte('created_at', prevToDate.toISOString()),
    ])

    // Calcul des variations en pourcentage
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100
      return ((current - previous) / previous) * 100
    }

    // Calculer les analytics dynamiques
    // Filtrer les no-show pour la période courante et précédente
    const noShowAppointmentsCurrent = appointments?.filter(app => app.status === 'no_show' && new Date(app.created_at) >= fromDate && new Date(app.created_at) <= toDate) || [];

    const analytics = {
      totalAppointments: {
        current: totalAppointmentsCurrent?.length || 0,
        previous: totalAppointmentsPrev?.length || 0,
        change: calcChange(totalAppointmentsCurrent?.length || 0, totalAppointmentsPrev?.length || 0)
      },
      totalProspects: {
        current: totalProspectsCurrent?.length || 0,
        previous: totalProspectsPrev?.length || 0,
        change: calcChange(totalProspectsCurrent?.length || 0, totalProspectsPrev?.length || 0)
      },
      noShowRate: {
        current: (totalAppointmentsCurrent?.length && noShowAppointmentsCurrent?.length)
          ? (noShowAppointmentsCurrent.length / totalAppointmentsCurrent.length) * 100
          : 0,
        previous: (totalAppointmentsPrev?.length && noShowAppointmentsCurrent?.length)
          ? (noShowAppointmentsCurrent.length / totalAppointmentsPrev.length) * 100
          : 0,
        change: calcChange(
          (totalAppointmentsCurrent?.length && noShowAppointmentsCurrent?.length)
            ? (noShowAppointmentsCurrent.length / totalAppointmentsCurrent.length) * 100
            : 0,
          (totalAppointmentsPrev?.length && noShowAppointmentsCurrent?.length)
            ? (noShowAppointmentsCurrent.length / totalAppointmentsPrev.length) * 100
            : 0
        )
      }
    }

    // Préparer les données pour le graphique
    const now = new Date()
    const currentWeekEnd = endOfWeek(now, { locale: fr })
    const timeRanges = {
      "1m": {
        start: startOfWeek(subMonths(now, 1), { locale: fr }),
        end: currentWeekEnd
      },
      "3m": {
        start: startOfWeek(subMonths(now, 3), { locale: fr }),
        end: currentWeekEnd
      },
      "year": {
        start: startOfYear(now),
        end: endOfYear(now)
      }
    }

    // Récupérer le nom du client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()

    if (clientError) {
      console.error('Erreur lors de la récupération du nom du client:', clientError)
    }

    // --- AJOUT : Récupérer le contrat actif/à venir/premier ---
    const { data: contracts, error: contractsError } = await supabase
      .from('client_contracts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    let contract = null
    let periods = []
    if (contracts && contracts.length > 0) {
      contract = contracts.find(c => c.status === 'active')
        || contracts.find(c => c.status === 'upcoming')
        || contracts[0]

      // Récupérer toutes les périodes du contrat, triées par date de début croissante
      const { data: allPeriods, error: periodsError } = await supabase
        .from('contract_periods')
        .select('*')
        .eq('contract_id', contract.id)
        .order('period_start', { ascending: true })
      periods = allPeriods || []
      contract.periods = periods
    }

    // Sélectionner la période la plus récente (period_start la plus grande)
    let period = null
    if (periods.length > 0) {
      period = periods.reduce((latest, p) => {
        return !latest || new Date(p.period_start) > new Date(latest.period_start) ? p : latest
      }, null)
    }

    // Retourner toutes les données
    return new Response(JSON.stringify({
      appointments: appointments || [],
      contacts: contacts || [],
      analytics,
      timeRanges,
      clientName: clientData?.name || null,
      contract,
      period
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error fetching client dashboard data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 