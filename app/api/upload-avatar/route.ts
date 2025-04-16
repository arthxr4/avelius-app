import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 })
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    // Vérifier la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File size must be less than 5MB", { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Convertir le File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop()
    const fileName = `avatar-${Date.now()}.${fileExt}`

    // Upload du fichier
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return new NextResponse("Error uploading file", { status: 500 })
    }

    // Créer une URL signée
    const { data: signedData } = await supabase.storage
      .from("avatars")
      .createSignedUrl(fileName, 60 * 60 * 24)

    if (!signedData?.signedUrl) {
      return new NextResponse("Error generating signed URL", { status: 500 })
    }

    // Mettre à jour le profil utilisateur avec la nouvelle URL
    const { error: updateError } = await supabase
      .from("users")
      .update({
        avatar_url: `avatars/${fileName}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user profile:", updateError)
      return new NextResponse("Error updating user profile", { status: 500 })
    }

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (error) {
    console.error("Error in upload-avatar:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 