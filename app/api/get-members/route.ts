import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { data: users, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, role, avatar_url")
    .in("role", ["admin", "agent"])

  if (error) {
    console.error("Error fetching members:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const usersWithAvatars = await Promise.all(
    users.map(async (user) => {
      const isSupabaseAvatar =
        user.avatar_url?.includes("avatars/") &&
        !user.avatar_url?.includes("storage.googleapis.com") // si pas déjà signé

      if (isSupabaseAvatar) {
        const path = user.avatar_url.split("avatars/")[1]

        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(path, 60 * 60 * 24)

        return {
          ...user,
          avatar_url: signed?.signedUrl ?? user.avatar_url,
        }
      }

      return user // rien à changer
    })
  )

  return NextResponse.json(usersWithAvatars)
}
