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

  // Requête principale avec le filtre client_id
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      client_id,
      contact_id,
      list_id,
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
    console.error("❌ Error fetching appointments:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("✅ Found appointments for client:", data?.length || 0)
  console.log("🔍 SQL Query:", (error as any)?.query || "Query not available")

  return NextResponse.json(data)
} 