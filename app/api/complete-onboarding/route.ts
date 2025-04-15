import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { first_name, last_name, avatar_url } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        avatar_url,
        first_login: new Date().toISOString(),
      })
      .eq("id", session.userId)

    if (error) {
      console.error("Error updating user:", error)
      return new NextResponse("Error updating user", { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 