import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"

export async function DELETE(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Non authentifié", { status: 401 })
    }

    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return new NextResponse("Email de l'utilisateur requis", { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // 1. Récupérer l'ID Clerk de l'utilisateur depuis Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, invited")
      .eq("email", userEmail)
      .single()

    if (userError) {
      console.error("Erreur lors de la récupération de l'utilisateur:", userError)
      return new NextResponse("Erreur lors de la récupération de l'utilisateur", { status: 500 })
    }

    if (!userData) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    // 2. Supprimer l'utilisateur ou révoquer l'invitation dans Clerk
    try {
      if (userData.id.startsWith('inv_')) {
        // C'est une invitation, on la révoque
        await clerkClient.invitations.revokeInvitation(userData.id)
      } else {
        // C'est un utilisateur actif, on le supprime
        await clerkClient.users.deleteUser(userData.id)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression dans Clerk:", error)
      return new NextResponse("Erreur lors de la suppression dans Clerk", { status: 500 })
    }

    // 3. Supprimer l'utilisateur de Supabase
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("email", userEmail)

    if (error) {
      console.error("Erreur lors de la suppression de l'utilisateur dans Supabase:", error)
      return new NextResponse("Erreur lors de la suppression de l'utilisateur dans Supabase", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 