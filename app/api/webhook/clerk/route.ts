import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"

export async function POST(req: Request) {
  // Vérifier la signature du webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
  }

  // Récupérer la signature du header
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // Si un des headers est manquant, erreur
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Récupérer le body
  const payload = await req.json()
  const body = JSON.stringify(payload)

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
    console.error("Error verifying webhook:", err)
    return new NextResponse("Error occured", {
      status: 400,
    })
  }

  const eventType = evt.type

  if (eventType === "user.created") {
    const { id, email_addresses, public_metadata } = evt.data
    const primaryEmail = email_addresses[0]?.email_address

    if (!primaryEmail) {
      console.error("No primary email found for user")
      return new NextResponse("No primary email found", { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Mettre à jour l'utilisateur dans Supabase avec l'ID Clerk
    const { error } = await supabase
      .from("users")
      .update({ 
        id: id,
        status: "active",
        email: primaryEmail,
        role: (public_metadata.role as string) || "user"
      })
      .eq("email", primaryEmail)

    if (error) {
      console.error("Error updating user in Supabase:", error)
      return new NextResponse("Error updating user", { status: 500 })
    }
  }

  return new NextResponse("", { status: 200 })
}

export const runtime = "nodejs" 