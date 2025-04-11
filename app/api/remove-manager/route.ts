import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { clientId, managerEmail } = await request.json()
    if (!clientId || !managerEmail) {
      return NextResponse.json(
        { error: "ID du client et email du manager requis" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Vérifier si l'utilisateur est admin dans la table users
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Trouver l'invitation en attente pour cet email
    const pendingInvitations = await clerkClient.invitations.getInvitationList()
    const invitation = pendingInvitations.find(
      (inv) => inv.emailAddress === managerEmail
    )

    // Si une invitation existe, la supprimer
    if (invitation) {
      await clerkClient.invitations.revokeInvitation(invitation.id)
    }

    // Supprimer l'entrée dans client_members
    const { error: deleteError } = await supabase
      .from("client_members")
      .delete()
      .eq("client_id", clientId)
      .eq("user_email", managerEmail)

    if (deleteError) {
      console.error("Error deleting client member:", deleteError)
      return NextResponse.json(
        { error: "Erreur lors de la suppression de l'accès" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in remove-manager:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'accès" },
      { status: 500 }
    )
  }
} 