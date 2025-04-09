import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { session_id } = await req.json()

  if (!session_id) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("phoning_session_contacts")
    .select("contact:contact_id(*)") // récupère tous les champs du contact lié
    .eq("phoning_session_id", session_id)

  if (error) {
    console.error("❌ Erreur récupération contacts liés :", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const contacts = data.map((row) => row.contact)

  return NextResponse.json({ contacts })
}
