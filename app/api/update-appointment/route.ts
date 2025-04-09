import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id, status, date } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Vérifier d'abord si le rendez-vous existe
    const { data: existingAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Erreur lors de la vérification:", fetchError)
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      )
    }

    // Préparer les données à mettre à jour
    const updateData: { status?: string; date?: string } = {}
    if (status) updateData.status = status
    if (date) updateData.date = date

    // Mettre à jour le rendez-vous
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()

    if (error) {
      console.error("Erreur lors de la mise à jour:", error)
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
    console.error("Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rendez-vous" },
      { status: 500 }
    )
  }
} 