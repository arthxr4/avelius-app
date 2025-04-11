import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function DELETE(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  console.log("🔐 User ID:", user.id)

  // Récupérer l'ID du client depuis l'URL
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("id")

  if (!clientId) {
    return NextResponse.json({ error: "ID du client requis" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Vérifier si l'utilisateur est admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  console.log("👤 Données utilisateur:", userData)
  console.log("❌ Erreur utilisateur:", userError)

  if (userError || !userData || userData.role !== "admin") {
    return NextResponse.json(
      { error: "Permission refusée - Rôle admin requis" },
      { status: 403 }
    )
  }

  // Vérifier si le client existe
  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single()

  console.log("📊 Client à supprimer:", client)
  console.log("❌ Erreur de récupération:", fetchError)

  if (fetchError || !client) {
    return NextResponse.json(
      { error: "Client non trouvé" },
      { status: 404 }
    )
  }

  // Supprimer le client
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)

  console.log("❌ Erreur de suppression:", deleteError)

  if (deleteError) {
    console.error("Erreur lors de la suppression:", deleteError)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
} 