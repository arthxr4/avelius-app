import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"

interface Contact {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  company?: string
  notes?: string
  client_id?: string
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session.userId
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await req.json()
    const { title, date, status, client_id, contacts } = body

    console.log("📥 Données reçues :", body)

    if (!title || !date || !status || !client_id) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    // Formatage de la date pour PostgreSQL
    const formattedDate = new Date(date + "T00:00:00Z").toISOString()

    const { data: list, error: listError } = await supabase
      .from("prospecting_lists")
      .insert({
        title,
        date: formattedDate,
        status,
        client_id,
        created_by: userId
      })
      .select("id")
      .single()

    if (listError) {
      console.error("❌ Erreur création liste:", listError)
      return NextResponse.json({ error: "Erreur lors de la création de la liste" }, { status: 500 })
    }

    const listId = list.id
    console.log("✅ Liste créée :", listId)
    console.log("📦 Import de contacts :", contacts.length)

    let newCount = 0
    let existingCount = 0
    let linkedCount = 0
    let failedCount = 0

    // Retirer les doublons basés sur email ou téléphone
    const uniqueContacts = contacts.filter(
      (contact: Contact, index: number, self: Contact[]) =>
        index === self.findIndex((c: Contact) =>
          (c.email && c.email === contact.email) ||
          (c.phone && c.phone === contact.phone)
        )
    )

    for (const contact of uniqueContacts) {
      // Skip si ni email ni téléphone
      if (!contact.email && !contact.phone) {
        console.warn("⚠️ Contact sans email ni téléphone ignoré :", contact)
        failedCount++
        continue
      }

      // 1. Vérifier si le contact existe déjà
      let existing = null
      let checkError = null

      if (contact.email) {
        const { data, error } = await supabase
          .from("contacts")
          .select("id")
          .eq("client_id", client_id)
          .eq("email", contact.email)
          .maybeSingle()

        existing = data
        checkError = error
      }

      if (!existing && contact.phone) {
        const { data, error } = await supabase
          .from("contacts")
          .select("id")
          .eq("client_id", client_id)
          .eq("phone", contact.phone)
          .maybeSingle()

        existing = data
        checkError = error
      }

      if (checkError) {
        console.error("❌ Erreur vérification contact existant", checkError)
        failedCount++
        continue
      }

      let contactId = existing?.id

      // 2. Si pas trouvé → créer
      if (!contactId) {
        const { data: newContact, error: insertError } = await supabase
          .from("contacts")
          .insert({ ...contact, client_id })
          .select("id")
          .single()

        if (insertError) {
          console.error("❌ Erreur insertion contact", insertError)
          failedCount++
          continue
        }

        contactId = newContact.id
        newCount++
      } else {
        existingCount++
      }

      // 3. Créer la relation dans la table pivot
      const { error: linkError } = await supabase
        .from("prospecting_list_contacts")
        .insert({ list_id: listId, contact_id: contactId })

      if (linkError) {
        console.error("❌ Erreur création lien liste-contact", linkError)
        failedCount++
      } else {
        linkedCount++
      }
    }

    console.log("📊 Résultat final :", {
      success: true,
      list_id: listId,
      created_contacts: newCount,
      existing_contacts: existingCount,
      linked_contacts: linkedCount,
      failed_contacts: failedCount,
    })

    return NextResponse.json({
      success: true,
      list_id: listId,
      created_contacts: newCount,
      existing_contacts: existingCount,
      linked_contacts: linkedCount,
      failed_contacts: failedCount,
    })
  } catch (error) {
    console.error("❌ Erreur inattendue:", error)
    return NextResponse.json({ error: "Une erreur inattendue est survenue" }, { status: 500 })
  }
}
