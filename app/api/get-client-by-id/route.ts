// ✅ API route : app/api/get-client-by-id/route.ts

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { client_id } = await req.json()
  if (!client_id || typeof client_id !== "string") {
    return NextResponse.json({ error: "Invalid client_id" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", client_id)
    .single()

  if (error) {
    console.error("❌ Supabase error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
