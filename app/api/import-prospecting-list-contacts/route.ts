import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface Contact {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company?: string
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { list_id, contacts } = body

    if (!list_id || !Array.isArray(contacts)) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer la liste pour vérifier qu'elle existe
    const { data: list, error: listError } = await supabase
      .from("prospecting_lists")
      .select("client_id")
      .eq("id", list_id)
      .single()

    if (listError || !list) {
      console.error("Error:", listError)
      return new NextResponse("List not found", { status: 404 })
    }

    let newCount = 0
    let existingCount = 0
    let failedCount = 0

    // Traiter chaque contact
    for (const contact of contacts) {
      // Vérifier si le contact existe déjà
      let existing = null
      let checkError = null

      if (contact.email) {
        const { data, error } = await supabase
          .from("prospecting_list_contacts")
          .select("id")
          .eq("list_id", list_id)
          .eq("email", contact.email)
          .maybeSingle()

        existing = data
        checkError = error
      }

      if (!existing && contact.phone) {
        const { data, error } = await supabase
          .from("prospecting_list_contacts")
          .select("id")
          .eq("list_id", list_id)
          .eq("phone", contact.phone)
          .maybeSingle()

        existing = data
        checkError = error
      }

      if (checkError) {
        console.error("Error checking existing contact:", checkError)
        failedCount++
        continue
      }

      if (existing) {
        existingCount++
        continue
      }

      // Créer le nouveau contact
      const { error: insertError } = await supabase
        .from("prospecting_list_contacts")
        .insert({
          list_id,
          ...contact,
          created_by: userId,
        })

      if (insertError) {
        console.error("Error inserting contact:", insertError)
        failedCount++
      } else {
        newCount++
      }
    }

    return NextResponse.json({
      success: true,
      created_contacts: newCount,
      existing_contacts: existingCount,
      failed_contacts: failedCount,
    })
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 