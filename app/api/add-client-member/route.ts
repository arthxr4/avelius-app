import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"

const addMemberSchema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = addMemberSchema.parse(body)

    // Détecter l'environnement et construire l'URL de redirection
    const headersList = headers()
    const host = headersList.get("host") || ""
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
    const redirectUrl = `${protocol}://${host}/sign-up`

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

    // Initialiser Supabase
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

    // Si l'utilisateur n'existe pas, le créer
    if (!existingUser) {
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: invitationId,
          email: validatedData.email,
          role: "manager",
          status: "invited",
          invited: true,
          created_at: new Date().toISOString()
        })

      if (userError) {
        console.error("Error creating user in Supabase:", userError)
        return new NextResponse("Error creating user", { status: 500 })
      }
    }

    // Vérifier si le membre est déjà associé au client
    const { data: existingMember } = await supabase
      .from("client_members")
      .select()
      .eq("client_id", validatedData.clientId)
      .eq("user_email", validatedData.email)
      .single()

    if (existingMember) {
      return new NextResponse("Member already exists for this client", { status: 400 })
    }

    // Associer l'utilisateur au client
    const { error: memberError } = await supabase
      .from("client_members")
      .insert({
        client_id: validatedData.clientId,
        user_email: validatedData.email,
        invited: true,
        created_at: new Date().toISOString()
      })

    if (memberError) {
      console.error("Error associating user with client:", memberError)
      return new NextResponse("Error associating user with client", { status: 500 })
    }

    return NextResponse.json({
      success: true,
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