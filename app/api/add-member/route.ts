import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"

// Définir les rôles valides pour correspondre à l'enum Supabase
type UserRole = "admin" | "manager" | "agent"

// Type pour correspondre à l'enum Supabase
type UserStatus = "invited" | "active"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "agent"] as const),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = inviteSchema.parse(body)

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
          role: validatedData.role,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return new NextResponse(errorData, { 
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const clerkData = await response.json()
    const invitationId = clerkData.id

    // Utiliser le client Supabase avec la clé de service
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

    // Créer l'utilisateur dans Supabase avec l'ID de l'invitation
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: invitationId,
        email: validatedData.email,
        role: validatedData.role,
        status: "invited" as UserStatus,
        invited: true,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error("Error creating user in Supabase:", insertError)
      return new NextResponse("Error creating user", { status: 500 })
    }

    return NextResponse.json({ success: true, invitation: clerkData })
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid input", { status: 400 })
    }
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 