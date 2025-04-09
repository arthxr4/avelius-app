import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getSessionContacts(session_id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("phoning_sessions")
    .select(`
      id,
      title,
      date,
      status,
      contacts:phoning_session_contacts (
        contact_id,
        contact:contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          company
        )
      )
    `)
    .eq("id", session_id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    title: data.title,
    date: data.date,
    status: data.status,
    contacts: data.contacts.map((item) => item.contact)
  }
}
