import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const body = await req.json()
  const { title, date, status, client_id, contacts } = body

  console.log("📥 Données reçues :", body)

  if (!title || !date || !status || !client_id) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const { data: session, error: sessionError } = await supabase
    .from("phoning_sessions")
    .insert({ title, date, status, client_id })
    .select("id")
    .single()

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  const sessionId = session.id
  console.log("✅ Session créée :", sessionId)
  console.log("📦 Import de contacts :", contacts.length)

  let newCount = 0
  let existingCount = 0
  let linkedCount = 0
  let alreadyLinkedCount = 0
  let failedCount = 0

  // 🔁 On retire les doublons côté JS (basé sur email ou téléphone)
  const uniqueContacts = contacts.filter(
    (contact, index, self) =>
      index === self.findIndex((c) =>
        (c.email && c.email === contact.email) ||
        (c.phone && c.phone === contact.phone)
      )
  )

  for (const contact of uniqueContacts) {
    // 🚫 Skip si ni email ni téléphone
    if (!contact.email && !contact.phone) {
      console.warn("⚠️ Contact sans email ni téléphone ignoré :", contact)
      failedCount++
      continue
    }
  
    // 1. Vérifie si le contact existe déjà
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
  
    // 3. Vérifie si déjà lié à la session
    const { data: existingLink, error: linkCheckError } = await supabase
      .from("phoning_session_contacts")
      .select("session_id")
      .eq("session_id", sessionId) // ✅ nom corrigé
      .eq("contact_id", contactId)
      .maybeSingle()
  
    if (linkCheckError) {
      console.error("❌ Erreur vérif lien session-contact", linkCheckError)
      failedCount++
      continue
    }
  
    if (existingLink) {
      alreadyLinkedCount++
      continue
    }
  
    // 4. Crée la relation dans la table pivot
    const { error: linkError } = await supabase
      .from("phoning_session_contacts")
      .insert({ session_id: sessionId, contact_id: contactId }) // ✅ nom corrigé
  
    if (linkError) {
      console.error("❌ Erreur création lien session-contact", linkError)
      failedCount++
    } else {
      linkedCount++
    }
  }
  

  console.log("📊 Résultat final :", {
    success: true,
    session_id: sessionId,
    created_contacts: newCount,
    existing_contacts: existingCount,
    linked_contacts: linkedCount,
    already_linked: alreadyLinkedCount,
    failed_contacts: failedCount,
  })

  return NextResponse.json({
    success: true,
    session_id: sessionId,
    created_contacts: newCount,
    existing_contacts: existingCount,
    linked_contacts: linkedCount,
    already_linked: alreadyLinkedCount,
    failed_contacts: failedCount,
  })
}
