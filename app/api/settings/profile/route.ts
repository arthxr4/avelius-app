import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select("first_name, last_name, avatar_url")
      .eq("id", userId)
      .single()

    if (error) throw error

    // Generate signed URL for avatar if it exists
    let fullAvatarUrl = data.avatar_url
    if (data.avatar_url) {
      const path = data.avatar_url.includes("avatars/")
        ? data.avatar_url.split("avatars/")[1]
        : data.avatar_url

      const { data: signedData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24)

      if (signedData) {
        fullAvatarUrl = signedData.signedUrl
      }
    }

    return NextResponse.json({
      ...data,
      avatar_url: fullAvatarUrl,
    })
  } catch (error) {
    console.error("[GET_PROFILE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const body = await request.json()
    const { first_name, last_name, avatar_url } = body

    const { error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("[PATCH_PROFILE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 