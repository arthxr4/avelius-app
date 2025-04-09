// app/api/get-clients/route.ts

import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("clients").select("*")

  if (error) {
    console.error("❌ Supabase error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("🔐 userId côté serveur :", user.id)
  return NextResponse.json(data)
}
