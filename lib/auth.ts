import { auth } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type UserRole = "admin" | "manager" | "agent"

export async function checkRole(allowedRoles: UserRole[]) {
  const { userId } = await auth()
  
  if (!userId) {
    return { error: new NextResponse("Non authentifié", { status: 401 }) }
  }

  // Créer le client Supabase avec la clé de service pour contourner la RLS
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

  // Récupérer l'email de l'utilisateur depuis Clerk
  const user = await auth().getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress

  if (!email) {
    return { error: new NextResponse("Email non trouvé", { status: 400 }) }
  }

  // Vérifier le rôle dans Supabase
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("email", email)
    .single()

  if (error || !data) {
    return { error: new NextResponse("Erreur lors de la vérification du rôle", { status: 500 }) }
  }

  if (!allowedRoles.includes(data.role)) {
    return { error: new NextResponse("Non autorisé", { status: 403 }) }
  }

  return { userId, email, role: data.role }
} 