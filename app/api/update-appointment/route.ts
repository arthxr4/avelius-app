import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, client_id, contact_id, status, date, contacts, notes } = await req.json()

    if (!id || !client_id || !contact_id) {
      return NextResponse.json({ error: "Données requises manquantes" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Mettre à jour les infos du contact si fourni
    if (contacts && (contacts.email || contacts.phone || contacts.company || contacts.first_name || contacts.last_name || typeof notes !== 'undefined')) {
      const updateContactFields: any = {
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        first_name: contacts.first_name,
        last_name: contacts.last_name,
      }
      if (typeof notes !== 'undefined') {
        updateContactFields.notes = notes
      }
      const { error: contactError } = await supabase
        .from("contacts")
        .update(updateContactFields)
        .eq("id", contact_id)
      if (contactError) {
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour du contact" },
          { status: 500 }
        )
      }
    }

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

    // DEBUG: log data et error pour comprendre le retour
    console.log("[update-appointment] data:", data)
    console.log("[update-appointment] error:", error)

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du rendez-vous", details: error, data },
        { status: 500 }
      )
    }

    // Pour debug, retourne tout
    return NextResponse.json({ success: true, data, error })
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rendez-vous" },
      { status: 500 }
    )
  }
} 