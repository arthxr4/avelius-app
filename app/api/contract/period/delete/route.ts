import { createClient } from '@supabase/supabase-js'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest) {
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

    // Récupérer l'ID de la période du body
    const { periodId } = await req.json()

    if (!periodId) {
      return new Response(JSON.stringify({ error: 'Period ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Vérifier que la période n'est pas la seule période du contrat
    const { data: period } = await supabase
      .from('contract_periods')
      .select('contract_id')
      .eq('id', periodId)
      .single()

    if (!period) {
      return new Response(JSON.stringify({ error: 'Period not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { count } = await supabase
      .from('contract_periods')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', period.contract_id)

    if (count === 1) {
      return new Response(JSON.stringify({ error: 'Cannot delete the only period of a contract' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Supprimer la période
    const { error } = await supabase
      .from('contract_periods')
      .delete()
      .eq('id', periodId)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error deleting contract period:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 