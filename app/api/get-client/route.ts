import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from "@clerk/nextjs/server"

interface Contract {
  start_date: string
  end_date: string
  contract_periods: any[]
}

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('id')

  if (!clientId) {
    return new NextResponse('ID du client manquant', { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  console.log('Recherche du client avec ID:', clientId)

  // Récupérer les informations du client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(`
      *,
      client_members (
        *,
        users:user_email (
          first_name,
          last_name,
          email,
          avatar_url
        )
      ),
      client_contracts!client_contracts_client_id_fkey (
        *,
        contract_periods (
          *
        )
      )
    `)
    .eq('id', clientId)
    .single()

  console.log('Résultat de la requête client:', { client, error: clientError })

  if (clientError) {
    if (clientError.code === 'PGRST116') {
      console.log('Client non trouvé avec ID:', clientId)
      return new NextResponse('Client non trouvé', { status: 404 })
    }
    console.error("Erreur lors de la récupération du client:", clientError)
    return new NextResponse("Erreur lors de la récupération du client", { status: 500 })
  }

  if (!client) {
    console.log('Client est null pour ID:', clientId)
    return new NextResponse('Client non trouvé', { status: 404 })
  }

  // Trouver le contrat actif
  const now = new Date().toISOString()
  const activeContract = client.client_contracts?.find((contract: Contract) => 
    contract.start_date <= now && contract.end_date >= now
  ) || null

  // Formater la réponse
  return NextResponse.json({
    client,
    activeContract,
    contractPeriods: activeContract?.contract_periods || [],
    members: client.client_members || []
  })
} 