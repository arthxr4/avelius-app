import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

export async function GET(req: Request) {
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

  // 1. Récupérer les informations du client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError) {
    console.error("Erreur lors de la récupération du client:", clientError)
    return new NextResponse("Erreur lors de la récupération du client", { status: 500 })
  }

  if (!client) {
    return new NextResponse('Client non trouvé', { status: 404 })
  }

  // 2. Récupérer les membres du client
  const { data: members, error: membersError } = await supabase
    .from('client_members')
    .select(`
      *,
      users:user_email (
        first_name,
        last_name,
        email,
        avatar_url,
        status
      )
    `)
    .eq('client_id', clientId)

  if (membersError) {
    console.error("Erreur lors de la récupération des membres:", membersError)
    return new NextResponse("Erreur lors de la récupération des membres", { status: 500 })
  }

  // 3. Récupérer les contrats du client
  const { data: contracts, error: contractsError } = await supabase
    .from('client_contracts')
    .select('*')
    .eq('client_id', clientId)
    .order('start_date', { ascending: false })

  if (contractsError) {
    console.error("Erreur lors de la récupération des contrats:", contractsError)
    return new NextResponse("Erreur lors de la récupération des contrats", { status: 500 })
  }

  // 4. Récupérer les périodes pour tous les contrats
  const contractIds = contracts?.map(contract => contract.id) || []
  const { data: periods, error: periodsError } = await supabase
    .from('contract_periods')
    .select('*')
    .in('contract_id', contractIds)
    .order('period_start', { ascending: false })

  if (periodsError) {
    console.error("Erreur lors de la récupération des périodes:", periodsError)
    return new NextResponse("Erreur lors de la récupération des périodes", { status: 500 })
  }

  // 5. Récupérer les RDV pour chaque période
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, created_at')
    .eq('client_id', clientId)

  if (appointmentsError) {
    console.error("Erreur lors de la récupération des RDV:", appointmentsError)
    return new NextResponse("Erreur lors de la récupération des RDV", { status: 500 })
  }

  // Calculer le nombre de RDV pour chaque période
  const periodsWithAppointments = periods?.map(period => {
    const periodStart = new Date(period.period_start)
    const periodEnd = new Date(period.period_end)
    periodEnd.setHours(23, 59, 59) // Inclure toute la journée de fin

    const rdv_realised = appointments?.filter(appointment => {
      const appointmentDate = new Date(appointment.created_at)
      return appointmentDate >= periodStart && appointmentDate <= periodEnd
    }).length || 0

    const performance_percent = period.goal > 0 ? Math.round((rdv_realised / period.goal) * 100) : 0

    return {
      ...period,
      rdv_realised,
      performance_percent
    }
  }) || []

  // Trouver le contrat actif
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]

  const contractsWithStatus = contracts?.map(contract => {
    let status = 'upcoming'
    if (contract.start_date <= today) {
      if (!contract.end_date || contract.end_date >= today) {
        status = 'active'
      } else {
        status = 'completed'
      }
    }
    return {
      ...contract,
      status
    }
  }) || []

  // Associer les périodes à leurs contrats respectifs
  const contractsWithPeriods = contractsWithStatus.map(contract => {
    const contractPeriods = periodsWithAppointments
      .filter(period => period.contract_id === contract.id)
      .sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime())
      .map(period => ({
        ...period,
        status: period.period_start <= today && period.period_end >= today ? 'active' : 
                period.period_end < today ? 'completed' : 'upcoming'
      }))
    
    return {
      ...contract,
      periods: contractPeriods
    }
  })

  // Trouver le contrat actif pour la rétrocompatibilité
  const activeContract = contractsWithStatus.find(contract => contract.status === 'active') || null

  // Pour le contrat actif, on veut la période en cours ou la plus récente
  const activeContractWithPeriods = activeContract ? {
    ...activeContract,
    periods: periodsWithAppointments
      .filter(period => period.contract_id === activeContract.id)
      .sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime())
      .map(period => ({
        ...period,
        status: period.period_start <= today && period.period_end >= today ? 'active' : 
                period.period_end < today ? 'completed' : 'upcoming'
      }))
  } : null

  // 6. Récupérer les documents du bucket
  const { data: files, error: filesError } = await supabase
    .storage
    .from('onboarding-docs')
    .list(`${clientId}`)

  if (filesError) {
    console.error("Erreur lors de la récupération des documents:", filesError)
    // On continue même s'il y a une erreur pour ne pas bloquer le reste
  }

  // Enrichir les fichiers avec leurs URLs signées et les métadonnées
  const documents = await Promise.all((files || []).map(async (file) => {
    const filePath = `${clientId}/${file.name}`
    const { data: signedUrlData } = await supabase
      .storage
      .from('onboarding-docs')
      .createSignedUrl(filePath, 3600) // URL valide pendant 1 heure

    return {
      name: file.name,
      size: file.metadata.size,
      created_at: file.created_at,
      publicUrl: signedUrlData?.signedUrl || '',
    }
  }))

  // Formater la réponse
  return NextResponse.json({
    ...client,
    members: members || [],
    contracts: contractsWithPeriods,
    activeContract: activeContractWithPeriods,
    documents
  })
} 