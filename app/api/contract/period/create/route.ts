import { createClient } from '@supabase/supabase-js'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Récupérer les données du body
    const { clientId, startDate, endDate, goal } = await req.json()

    if (!clientId || !startDate || !endDate || !goal || goal < 1) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Récupérer le contrat actif du client
    const { data: activeContract, error: contractError } = await supabase
      .from('client_contracts')
      .select('id')
      .eq('client_id', clientId)
      .is('end_date', null)
      .single()

    if (contractError) throw contractError

    if (!activeContract) {
      return new Response(JSON.stringify({ error: 'No active contract found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Créer la nouvelle période
    const { error: periodError } = await supabase
      .from('contract_periods')
      .insert({
        contract_id: activeContract.id,
        period_start: startDate,
        period_end: endDate,
        goal: goal,
        status: 'active',
        performance_percent: 0,
      })

    if (periodError) throw periodError

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating contract period:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 