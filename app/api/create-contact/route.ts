// app/api/create-contact/route.ts

import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const { client_id, first_name, last_name, email, phone, company } = body

  if (!client_id || !first_name || !last_name) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      client_id,
      first_name,
      last_name,
      email,
      phone,
      company,
    })
    .select("*")
    .single()

  if (error) {
    console.error("❌ Supabase error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
