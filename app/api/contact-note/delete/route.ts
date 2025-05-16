import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function DELETE(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { note_id } = await req.json()
    if (!note_id) {
      return NextResponse.json({ error: "note_id requis" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from("contact_notes")
      .delete()
      .eq("id", note_id)
      .eq("user_id", user.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
