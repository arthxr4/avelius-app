import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, client_id, contact_id, status, date } = await req.json()

    if (!id || !client_id || !contact_id) {
      return NextResponse.json({ error: "Données requises manquantes" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Vérifier d'abord si le rendez-vous existe
    const { data: existingAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .eq("client_id", client_id.toString())
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      )
    }

    // Mettre à jour le rendez-vous
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status,
        date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("client_id", client_id.toString())
      .select()

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du rendez-vous" },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Aucun rendez-vous mis à jour" },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rendez-vous" },
      { status: 500 }
    )
  }
} 