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
      // Nettoyer et diviser les termes de recherche
      const searchTerms = search.trim().toLowerCase().split(/\s+/)

      if (searchTerms.length > 1) {
        // Si plusieurs termes, chercher les combinaisons nom/prénom dans les deux sens
        query = query.or(
          `and(first_name.ilike.%${searchTerms[0]}%,last_name.ilike.%${searchTerms[1]}%),` +
          `and(first_name.ilike.%${searchTerms[1]}%,last_name.ilike.%${searchTerms[0]}%),` +
          // Recherche exacte sur le nom complet
          `or(first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%)`
        )
      } else {
        // Si un seul terme, recherche simple sur tous les champs
        query = query.or(
          `first_name.ilike.%${search}%,` +
          `last_name.ilike.%${search}%,` +
          `email.ilike.%${search}%,` +
          `phone.ilike.%${search}%,` +
          `company.ilike.%${search}%`
        )
      }
    }

    const { data, error } = await query
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
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