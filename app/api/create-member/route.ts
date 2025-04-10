// app/api/create-member/route.ts

import { auth } from "@clerk/nextjs"
import { clerkClient } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { email, role } = await req.json()

  if (!email || !role) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  try {
    // 1. Envoyer une invitation Clerk (si possible)
    let invitation
    try {
      invitation = await clerkClient.invitations.createInvitation({
        emailAddress: email,
      })
    } catch (err: any) {
      console.warn("⚠️ Invitation skipped or already sent:", err.message)
    }

    // 2. Enregistrer l'utilisateur dans Supabase
    const supabase = await createServerSupabaseClient()

    const { error: dbError } = await supabase.from("users").insert({
      id: email, // temporairement l'email, à remplacer à l'activation
      email,
      role,
      invited: true,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("❌ Supabase error:", dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, invitation })
  } catch (err: any) {
    console.error("❌ Clerk error:", err)
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 })
  }
}