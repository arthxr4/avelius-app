import { createServerSupabaseClient } from "@/lib/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const { client_id, search } = await req.json()

    if (!client_id || !search) {
      return NextResponse.json(
        { error: "client_id et search sont requis" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("client_id", client_id)
      .or(
        `first_name.ilike.%${search}%,` +
        `last_name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `phone.ilike.%${search}%,` +
        `company.ilike.%${search}%`
      )
      .limit(10)

    if (error) {
      console.error("❌ Erreur Supabase:", error.message)
      return NextResponse.json(
        { error: "Erreur lors de la recherche des contacts" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recherche des contacts" },
      { status: 500 }
    )
  }
} 