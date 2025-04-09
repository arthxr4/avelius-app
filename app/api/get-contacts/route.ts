// app/api/get-contacts/route.ts

import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { client_id } = await req.json()

  if (!client_id) {
    return NextResponse.json({ error: "Client ID requis" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("client_id", client_id)

  if (error) {
    console.error("❌ Supabase error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
