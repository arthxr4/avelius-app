// app/api/create-client/route.ts

import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { name } = await req.json()

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid client name" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("clients").insert({
    name,
    created_by: user.id,
    created_at: new Date().toISOString(),
  }).select("*").single()

  if (error) {
    console.error("❌ Supabase error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("✅ Client créé :", data)
  return NextResponse.json(data)
}
