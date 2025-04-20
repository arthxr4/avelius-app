import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookies = new URL(req.url).searchParams.get('cookies')
            if (!cookies) return ''
            
            const cookie = JSON.parse(cookies)
            return cookie[name]
          },
        },
      }
    )

    const json = await req.json()
    const {
      client_id,
      start_date,
      end_date,
      is_recurring,
      recurrence_unit,
      recurrence_every,
      default_goal,
      first_period_end,
    } = json

    // Créer le contrat
    const { data: contract, error } = await supabase
      .from("client_contracts")
      .insert({
        client_id,
        start_date,
        end_date,
        is_recurring,
        recurrence_unit,
        recurrence_every,
        default_goal,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur lors de la création du contrat:", error)
      return new NextResponse("Erreur lors de la création du contrat", { status: 500 })
    }

    // Créer la première période du contrat
    const { error: periodError } = await supabase
      .from("contract_periods")
      .insert({
        contract_id: contract.id,
        period_start: start_date,
        period_end: is_recurring ? first_period_end : end_date,
        goal: default_goal,
        status: 'active'
      })

    if (periodError) {
      console.error("Erreur lors de la création de la période:", periodError)
      // On ne retourne pas d'erreur car le contrat a été créé avec succès
      // mais on log l'erreur pour le debugging
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error("Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 