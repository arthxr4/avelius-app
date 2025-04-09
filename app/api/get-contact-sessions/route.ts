import { createServerSupabaseClient } from "@/lib/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

interface PhoningSession {
  id: string
  title: string
}

interface PhoningSessionContact {
  phoning_sessions: PhoningSession
}

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const { client_id, contact_id } = await req.json()

    if (!client_id || !contact_id) {
      return NextResponse.json(
        { error: "client_id et contact_id sont requis" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Récupérer les sessions où le contact est présent
    const { data: sessions, error } = await supabase
      .from("phoning_session_contacts")
      .select(`
        phoning_sessions (
          id,
          title
        )
      `)
      .eq("contact_id", contact_id)

    if (error) {
      console.error("❌ Erreur Supabase:", error.message)
      return NextResponse.json(
        { error: "Erreur lors de la récupération des sessions" },
        { status: 500 }
      )
    }

    // Transformer les données pour n'avoir que les sessions
    const formattedSessions = (sessions || [])
      .filter((sc: any) => sc.phoning_sessions)
      .map((sc: any) => ({
        id: sc.phoning_sessions.id,
        name: sc.phoning_sessions.title // On utilise le champ title au lieu de name
      }))

    return NextResponse.json(formattedSessions)
  } catch (error) {
    console.error("❌ Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sessions" },
      { status: 500 }
    )
  }
} 