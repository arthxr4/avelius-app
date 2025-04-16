// app/api/create-client/route.ts

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"

type UserStatus = "invited" | "active"

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Détecter l'environnement et construire l'URL de redirection
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
    const redirectUrl = `${protocol}://${host}/sign-up`

    console.log("Redirect URL:", redirectUrl) // Pour debug

    // Créer l'invitation via Clerk
    const response = await fetch("https://api.clerk.com/v1/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: validatedData.email,
        redirect_url: redirectUrl,
        public_metadata: {
          role: "manager",
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Clerk invitation error:", errorData)
      return new NextResponse(errorData, { 
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const clerkData = await response.json()
    const invitationId = clerkData.id

    // Initialiser Supabase avec la clé de service
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select()
      .eq("email", validatedData.email)
      .single()

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 })
    }

    // Créer le client d'abord
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: validatedData.name,
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (clientError) {
      console.error("Error creating client:", clientError)
      return new NextResponse("Error creating client", { status: 500 })
    }

    // Créer l'utilisateur dans Supabase avec l'ID de l'invitation
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: invitationId,
        email: validatedData.email,
        role: "manager",
        status: "invited" as UserStatus,
        invited: true,
        created_at: new Date().toISOString()
      })

    if (userError) {
      // Si l'insertion de l'utilisateur échoue, supprimer le client
      await supabase.from("clients").delete().eq("id", client.id)
      console.error("Error creating user in Supabase:", userError)
      return new NextResponse("Error creating user", { status: 500 })
    }

    // Associer l'utilisateur au client
    const { error: memberError } = await supabase
      .from("client_members")
      .insert({
        client_id: client.id,
        user_email: validatedData.email,
        invited: true,
        created_at: new Date().toISOString()
      })

    if (memberError) {
      // Si l'association échoue, nettoyer les données créées
      await supabase.from("users").delete().eq("id", invitationId)
      await supabase.from("clients").delete().eq("id", client.id)
      console.error("Error associating user with client:", memberError)
      return new NextResponse("Error associating user with client", { status: 500 })
    }

    return NextResponse.json({
      success: true,
      client,
      invitation: clerkData
    })
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid input", { status: 400 })
    }
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
