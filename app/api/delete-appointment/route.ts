import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function DELETE(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  console.log("🔐 User role:", user.publicMetadata?.role)
  console.log("🔐 User ID:", user.id)

  // Récupérer l'ID du rendez-vous depuis l'URL
  const { searchParams } = new URL(req.url)
  const appointmentId = searchParams.get("id")

  if (!appointmentId) {
    return NextResponse.json({ error: "ID du rendez-vous requis" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Vérifier d'abord si le rendez-vous existe
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .single()

  console.log("📊 Rendez-vous à supprimer:", appointment)
  console.log("❌ Erreur de récupération:", fetchError)

  if (fetchError || !appointment) {
    return NextResponse.json(
      { error: "Rendez-vous non trouvé" },
      { status: 404 }
    )
  }

  // Supprimer le rendez-vous
  const { error: deleteError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)

  console.log("❌ Erreur de suppression:", deleteError)

  if (deleteError) {
    console.error("Erreur lors de la suppression:", deleteError)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du rendez-vous" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}