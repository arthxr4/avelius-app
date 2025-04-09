// app/api/get-appointments-by-session/route.ts
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get("session_id")

  console.log("🔍 Received session_id:", session_id)

  if (!session_id) return NextResponse.json({ error: "session_id requis" }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  console.log("🔄 Fetching appointments for session:", session_id)

  // Vérifions d'abord tous les rendez-vous pour debug
  const { data: allAppointments, error: allError } = await supabase
    .from("appointments")
    .select("*")

  console.log("📊 All appointments in DB:", allAppointments?.length || 0)
  console.log("📊 First appointment raw data:", allAppointments?.[0])

  // Requête principale avec le filtre session_id
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      client_id,
      contact_id,
      session_id,
      date,
      status,
      added_by,
      created_at,
      contacts (
        first_name,
        last_name,
        email,
        phone,
        company
      )
    `)
    .eq("session_id", session_id)
    .order("date", { ascending: true })

  if (error) {
    console.error("❌ Main query error:", error.message)
    console.error("❌ Main query error details:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("✅ Found appointments for session:", data?.length || 0)
  console.log("📊 First session appointment:", data?.[0])

  return NextResponse.json(data)
}
