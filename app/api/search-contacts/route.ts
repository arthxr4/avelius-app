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

    if (!client_id || search === undefined) {
      return NextResponse.json(
        { error: "client_id est requis et search doit être défini" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from("contacts")
      .select("*")
      .eq("client_id", client_id)

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,` +
        `last_name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `phone.ilike.%${search}%,` +
        `company.ilike.%${search}%`
      )
    }

    const { data, error } = await query.limit(10)

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