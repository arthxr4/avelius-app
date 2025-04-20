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
    const { contract_id, start_date, end_date, goal } = json

    // Créer la période de contrat
    const { data: period, error } = await supabase
      .from("contract_periods")
      .insert({
        contract_id,
        start_date,
        end_date,
        goal,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur lors de la création de la période:", error)
      return new NextResponse("Erreur lors de la création de la période", { status: 500 })
    }

    return NextResponse.json(period)
  } catch (error) {
    console.error("Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 