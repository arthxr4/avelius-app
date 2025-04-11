// app/api/create-client/route.ts

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { name, email } = await req.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Le nom et l'email sont requis" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 1. Créer le client dans Supabase
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert([
        {
          name,
          created_by: userId,
        },
      ])
      .select()
      .single()

    if (clientError) {
      console.error("Erreur lors de la création du client:", clientError)
      return NextResponse.json(
        { error: "Erreur lors de la création du client" },
        { status: 500 }
      )
    }

    // 2. Créer l'utilisateur dans la table users avec le rôle manager
    const { error: userError } = await supabase.from("users").insert([
      {
        id: email, // temporairement l'email, sera remplacé par l'ID Clerk à l'activation
        email,
        role: "manager",
        invited: true,
        status: "invited",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (userError) {
      // Si l'insertion de l'utilisateur échoue, supprimer le client
      await supabase.from("clients").delete().eq("id", client.id)
      console.error("Erreur lors de la création de l'utilisateur:", userError)
      return NextResponse.json(
        { error: "Erreur lors de la création de l'utilisateur" },
        { status: 500 }
      )
    }

    // 3. Créer la relation dans client_members avec l'email
    const { error: memberError } = await supabase.from("client_members").insert([
      {
        client_id: client.id,
        user_email: email,
        invited: true,
        created_at: new Date().toISOString(),
      },
    ])

    if (memberError) {
      // Si l'insertion de la relation échoue, supprimer l'utilisateur et le client
      await supabase.from("users").delete().eq("id", email)
      await supabase.from("clients").delete().eq("id", client.id)
      console.error("Erreur lors de la création de la relation:", memberError)
      return NextResponse.json(
        { error: "Erreur lors de la création de la relation" },
        { status: 500 }
      )
    }

    // 4. Envoyer l'invitation via l'API Clerk
    try {
      // Détecter l'environnement et construire l'URL de redirection
      const headersList = await headers()
      const host = headersList.get("host") || ""
      const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
      const redirectUrl = `${protocol}://${host}/sign-up`

      console.log("Redirect URL:", redirectUrl)

      const response = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          email_address: email,
          redirect_url: redirectUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'invitation")
      }

      const invitation = await response.json()
      return NextResponse.json({ success: true, client, invitation })
    } catch (error) {
      console.warn("⚠️ Erreur lors de l'envoi de l'invitation:", error)
      // On retourne quand même un succès car l'utilisateur et le client sont créés
      return NextResponse.json({ success: true, client })
    }
  } catch (error) {
    console.error("Erreur inattendue:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}
