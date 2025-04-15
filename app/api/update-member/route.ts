import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return new NextResponse("User ID and role are required", { status: 400 })
    }

    if (!["admin", "agent"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 })
    }

    // 1. Mettre à jour le rôle dans Clerk
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { role },
      })
    } catch (error) {
      console.error("Error updating user in Clerk:", error)
      return new NextResponse("Error updating user in Clerk", { status: 500 })
    }

    // 2. Mettre à jour le rôle dans Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user in Supabase:", error)
      return new NextResponse("Error updating user in Supabase", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 