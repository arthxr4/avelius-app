import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return new NextResponse("Client ID is required", { status: 400 })
    }

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

    // Récupérer les membres du client avec leurs informations utilisateur
    const { data: members, error } = await supabase
      .from("client_members")
      .select(`
        id,
        user_email,
        invited,
        accepted_at,
        users (
          first_name,
          last_name,
          email,
          status
        )
      `)
      .eq("client_id", clientId)

    if (error) {
      console.error("Error fetching members:", error)
      return new NextResponse("Error fetching members", { status: 500 })
    }

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 