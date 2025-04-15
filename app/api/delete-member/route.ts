import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 })
    }

    // 1. Supprimer l'utilisateur de Clerk
    try {
      await clerkClient.users.deleteUser(userId)
    } catch (error) {
      console.error("Error deleting user from Clerk:", error)
      return new NextResponse("Error deleting user from Clerk", { status: 500 })
    }

    // 2. Supprimer l'utilisateur de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (error) {
      console.error("Error deleting user from Supabase:", error)
      return new NextResponse("Error deleting user from Supabase", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 