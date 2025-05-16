import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { contact_id, content } = await req.json()
    if (!contact_id || !content) {
      return NextResponse.json({ error: "contact_id et content requis" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("contact_notes")
      .insert({
        contact_id,
        content,
        user_id: user.id,
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
