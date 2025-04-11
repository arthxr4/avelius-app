import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Webhook } from "svix"

// Définir les rôles valides pour correspondre à l'enum Supabase
type UserRole = "admin" | "manager" | "agent"

// Définir les statuts valides pour correspondre à l'enum Supabase
type UserStatus = "invited" | "active"

// Fonction pour valider le rôle
function isValidRole(role: string): role is UserRole {
  return ["admin", "manager", "agent"].includes(role)
}

export async function POST(req: Request) {
  try {
    // Log initial pour vérifier que le webhook est appelé
    console.log("🔔 Webhook called at:", new Date().toISOString())

    // Vérifier la signature du webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      console.error("❌ Missing CLERK_WEBHOOK_SECRET")
      throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
    }

    // Récupérer la signature du header
    const headersList = await headers()
    const svix_id = headersList.get("svix-id")
    const svix_timestamp = headersList.get("svix-timestamp")
    const svix_signature = headersList.get("svix-signature")

    // Si un des headers est manquant, erreur
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing Svix headers:", { svix_id, svix_timestamp, svix_signature })
      return new NextResponse("Error occured -- no svix headers", {
        status: 400,
      })
    }

    // Récupérer le body
    const payload = await req.json()
    const body = JSON.stringify(payload)
    console.log("📦 Webhook payload:", body)

    // Créer une instance Svix pour vérifier la signature
    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error("❌ Error verifying webhook:", err)
      return new NextResponse("Error occured", {
        status: 400,
      })
    }

    const eventType = evt.type
    console.log("📣 Event type:", eventType)

    if (eventType === "user.created") {
      const { id, email_addresses, primary_email_address_id } = evt.data

      const email = email_addresses.find(
        (email) => email.id === primary_email_address_id
      )?.email_address

      if (!email) {
        console.error("❌ No primary email found for user")
        return new NextResponse("No primary email found", { status: 400 })
      }

      console.log("🔑 Creating Supabase client...")
      // Utiliser le client Supabase avec la clé de service
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

      console.log("🔍 Checking existing user in Supabase...")
      // Vérifier d'abord si l'utilisateur existe
      const { data: existingUser, error: selectError } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .single()

      if (selectError) {
        console.error("❌ Error checking existing user:", selectError)
        return new NextResponse("Error checking user", { status: 500 })
      }

      if (!existingUser) {
        console.error("❌ No user found in Supabase for email:", email)
        return new NextResponse("User not found", { status: 404 })
      }

      console.log("✅ Found existing user:", existingUser)

      // 1. Mettre à jour l'utilisateur dans Supabase avec le nouvel ID
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          id: id,
          status: "active" as UserStatus,
          invited: false,
          accepted_at: new Date().toISOString()
        })
        .eq("email", email)

      if (updateError) {
        console.error("❌ Error updating user in Supabase:", updateError)
        return new NextResponse("Error updating user", { status: 500 })
      }

      console.log("✅ Successfully updated user in Supabase:", {
        id,
        email: email,
        role: existingUser.role,
        status: "active"
      })

      // 2. Mettre à jour les relations dans client_members
      const { error: memberError } = await supabase
        .from("client_members")
        .update({
          user_id: id,
          invited: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", email)

      if (memberError) {
        console.error("Erreur lors de la mise à jour des relations:", memberError)
        return new NextResponse("Erreur lors de la mise à jour des relations", {
          status: 500,
        })
      }

      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export const runtime = "nodejs" 