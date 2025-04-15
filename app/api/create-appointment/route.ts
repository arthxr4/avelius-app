// app/api/create-appointment/route.ts

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const { client_id, contact_id, list_id, date } = await req.json()

    if (!client_id || !contact_id || !list_id || !date) {
      return NextResponse.json(
        { error: "client_id, contact_id, list_id et date sont requis" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Créer le rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        client_id,
        contact_id,
        list_id,
        date,
        status: "confirmed", // Statut par défaut
        added_by: user.id, // Clerk ID est le même que le sub du JWT
      })
      .select("*, contacts(*)")
      .single()

    if (appointmentError) {
      console.error("❌ Erreur Supabase:", appointmentError.message)
      return NextResponse.json(
        { error: "Erreur lors de la création du rendez-vous" },
        { status: 500 }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("❌ Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous" },
      { status: 500 }
    )
  }
}
