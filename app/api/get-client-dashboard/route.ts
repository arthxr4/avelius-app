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

    // Récupérer toutes les données en parallèle
    const [
      { data: appointments },
      { data: contacts },
      { data: noShowAppointments },
      { data: totalAppointments },
      { data: totalProspects }
    ] = await Promise.all([
      // Tous les rendez-vous du client
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

      // Tous les contacts du client
      supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId),

      // Rendez-vous "no-show"
      supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', 'no_show'),

      // Total des rendez-vous sur le dernier mois
      supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', subMonths(new Date(), 1).toISOString()),

      // Total des prospects (contacts) sur le dernier mois
      supabase
        .from('contacts')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', subMonths(new Date(), 1).toISOString())
    ])

    // Calculer les analytics
    const analytics = {
      totalAppointments: totalAppointments?.length || 0,
      totalProspects: totalProspects?.length || 0,
      noShowRate: noShowAppointments?.length && appointments?.length 
        ? (noShowAppointments.length / appointments.length) * 100 
        : 0
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

    // Retourner toutes les données
    return new Response(JSON.stringify({
      appointments: appointments || [],
      contacts: contacts || [],
      analytics,
      timeRanges
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