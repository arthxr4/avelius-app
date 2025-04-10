import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = inviteSchema.parse(body)

    // Construire l'URL de redirection complète
    const redirectUrl = "https://enormous-calf-57.accounts.dev/sign-up"

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

    const responseData = await response.text()
    
    if (!response.ok) {
      // On renvoie directement l'erreur de Clerk au client
      return new NextResponse(responseData, { 
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    return NextResponse.json({ success: true, invitation: JSON.parse(responseData) })
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid input", { status: 400 })
    }
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 