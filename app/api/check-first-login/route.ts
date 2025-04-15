import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from("users")
      .select("first_login")
      .eq("id", session.userId)
      .single()

    return NextResponse.json({
      isFirstLogin: !user?.first_login,
    })
  } catch (error) {
    console.error("Error checking first login:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 