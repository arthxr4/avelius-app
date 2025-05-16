import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contact_id = searchParams.get("id")?.trim()

  if (!contact_id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  // Récupérer le contact
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contact_id)
    .single()
  if (contactError) {
    return NextResponse.json({ error: contactError.message }, { status: 500 })
  }

  // Récupérer les notes du contact
  const { data: notes, error: notesError } = await supabase
    .from("contact_notes")
    .select("*, users: user_id (id, first_name, last_name, avatar_url)")
    .eq("contact_id", contact_id)
    .order("created_at", { ascending: false })
  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 })
  }

  // Récupérer les rendez-vous liés à ce contact
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("contact_id", contact_id)
    .order("date", { ascending: true })
  if (appointmentsError) {
    return NextResponse.json({ error: appointmentsError.message }, { status: 500 })
  }

  return NextResponse.json({
    contact,
    notes,
    appointments,
  })
}
