import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
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

  const { data: users, error } = await supabase
    .from("users")
    .select(`
      id, 
      first_name, 
      last_name, 
      email, 
      role, 
      avatar_url, 
      last_seen_at,
      client_members (
        client_id,
        clients (
          name
        )
      )
    `)
    .in("role", ["admin", "agent", "manager"])

  if (error) {
    console.error("Error fetching members:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const usersWithAvatars = await Promise.all(
    users.map(async (user) => {
      const isSupabaseAvatar =
        user.avatar_url?.includes("avatars/") &&
        !user.avatar_url?.includes("storage.googleapis.com")

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

      return user
    })
  )

  return NextResponse.json(usersWithAvatars)
}
