// app/api/get-appointments/route.ts
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const client_id = searchParams.get("client_id")?.trim()

  console.log("🔍 Received client_id:", client_id)
  console.log("🔍 Client ID length:", client_id?.length)

  if (!client_id) return NextResponse.json({ error: "client_id requis" }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  // Vérifions la structure de la table
  const { data: tableInfo, error: tableError } = await supabase
    .from("appointments")
    .select("*")
    .limit(1)

  if (tableError) {
    console.error("❌ Table error:", tableError.message)
    console.error("❌ Table error details:", tableError)
  }

  // Essayons une requête sans filtre pour voir tous les rendez-vous
  const { data: allAppointments, error: allError } = await supabase
    .from("appointments")
    .select("*")

  if (allError) {
    console.error("❌ All appointments error:", allError.message)
    console.error("❌ All appointments error details:", allError)
  }

  console.log("📊 Total appointments in DB:", allAppointments?.length || 0)
  console.log("📊 First appointment raw data:", allAppointments?.[0])

  // Requête principale avec le filtre client_id
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
    .eq("client_id", client_id)
    .order("date", { ascending: true })

  if (error) {
    console.error("❌ Main query error:", error.message)
    console.error("❌ Main query error details:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("✅ Found appointments for client:", data?.length || 0)
  console.log("🔍 SQL Query:", (error as any)?.query || "Query not available")

  return NextResponse.json(data)
} 