// app/api/get-clients/route.ts

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

export async function GET() {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  // Récupérer les clients avec les informations du manager si elles existent
  const { data: clients, error } = await supabase
    .from("clients")
    .select(`
      *,
      client_members (
        user_email,
        users (
          status
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    return new NextResponse("Error fetching clients", { status: 500 })
  }

  // Formater les données pour inclure l'email du manager et son statut si disponibles
  const formattedClients = clients.map(client => ({
    ...client,
    manager_email: client.client_members?.[0]?.user_email || null,
    manager_status: client.client_members?.[0]?.users?.status || null
  }))

  return NextResponse.json(formattedClients)
}
