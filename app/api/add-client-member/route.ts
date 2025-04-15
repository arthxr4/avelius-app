import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const addMemberSchema = z.object({
  clientId: z.string(),
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

    // Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("email", validatedData.email)
      .single()

    if (userError) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Vérifier si l'utilisateur est déjà membre du client
    const { data: existingMember } = await supabase
      .from("client_members")
      .select()
      .eq("client_id", validatedData.clientId)
      .eq("user_email", validatedData.email)
      .single()

    if (existingMember) {
      return new NextResponse("User is already a member of this client", { status: 400 })
    }

    // Ajouter le membre au client
    const { error: insertError } = await supabase
      .from("client_members")
      .insert({
        client_id: validatedData.clientId,
        user_email: validatedData.email,
        invited: true,
      })

    if (insertError) {
      console.error("Error adding member:", insertError)
      return new NextResponse("Error adding member", { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid input", { status: 400 })
    }
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 