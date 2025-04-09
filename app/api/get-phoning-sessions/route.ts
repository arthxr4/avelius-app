// app/api/get-phoning-sessions/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { client_id } = await req.json()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("phoning_sessions")
    .select("*")
    .eq("client_id", client_id)
    .order("date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
