import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: Request) {
  console.log('--- DEBUT HANDLER DELETE MEMBER ---')
  try {
    const user = await currentUser()
    if (!user) {
      console.log('Utilisateur non authentifié')
      return new NextResponse("Non authentifié", { status: 401 })
    }

    let body
    try {
      body = await request.json()
      console.log('Body reçu:', body)
    } catch (e) {
      console.error('Erreur parsing JSON:', e)
      return new NextResponse("Body JSON invalide", { status: 400 })
    }

    const { userId } = body || {}
    if (!userId) {
      console.log('userId manquant dans le body')
      return new NextResponse("ID Clerk requis", { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('--- DELETE MEMBER API ---')
    console.log('userId reçu:', userId)

    // DEBUG : log tous les ids présents dans la table users
    const allUsers = await supabaseService
      .from("users")
      .select("id")
    console.log("Tous les ids dans Supabase:", allUsers.data)
    console.log("userId reçu pour suppression:", userId)

    const { data: userData, error: userError } = await supabaseService
      .from("users")
      .select("id, invited")
      .eq("id", userId)
      .maybeSingle()

    if (userError) {
      console.error("Erreur lors de la récupération de l'utilisateur:", userError)
      return new NextResponse("Erreur lors de la récupération de l'utilisateur", { status: 500 })
    }

    if (!userData) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    // Tente la suppression dans Clerk, mais ignore toute erreur
    try {
      console.log('Tentative de suppression invitation Clerk pour', userId)
      await clerkClient.invitations.revokeInvitation(userId)
      console.log('Suppression invitation Clerk OK')
    } catch (e) {
      console.warn('Erreur suppression invitation Clerk (ignorée):', e)
    }
    try {
      console.log('Tentative de suppression user Clerk pour', userId)
      await clerkClient.users.deleteUser(userId)
      console.log('Suppression user Clerk OK')
    } catch (e) {
      console.warn('Erreur suppression user Clerk (ignorée):', e)
    }

    // Supprime toujours dans Supabase
    console.log('Suppression dans Supabase pour', userId)
    const { error: supabaseError } = await supabaseService
      .from("users")
      .delete()
      .eq("id", userId)

    if (supabaseError) {
      console.error("Erreur lors de la suppression de l'utilisateur dans Supabase:", supabaseError)
      return new NextResponse("Erreur lors de la suppression de l'utilisateur dans Supabase", { status: 500 })
    }

    console.log('Suppression terminée pour', userId)
    console.log('--- FIN HANDLER DELETE MEMBER ---')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('ERREUR GLOBALE DANS DELETE MEMBER:', error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 