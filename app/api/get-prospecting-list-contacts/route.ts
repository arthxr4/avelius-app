import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  status: string
}

interface ContactWithAppointment extends Contact {
  has_appointment: boolean
}

interface ListContact {
  contact: Contact
}

interface Appointment {
  contact_id: string
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get("list_id")

    if (!listId) {
      return new NextResponse("List ID is required", { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer les contacts de la liste avec leur statut de rendez-vous
    const { data: contacts, error } = await supabase
      .from("prospecting_list_contacts")
      .select(`
        contact:contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          company,
          status
        )
      `)
      .eq("list_id", listId)
      .returns<ListContact[]>()

    if (error) {
      console.error("Error:", error)
      return new NextResponse("Error fetching contacts", { status: 500 })
    }

    if (!contacts?.length) {
      return NextResponse.json([])
    }

    // Vérifier si les contacts ont des rendez-vous
    const { data: appointments } = await supabase
      .from("appointments")
      .select("contact_id")
      .in(
        "contact_id",
        contacts.map((c: ListContact) => c.contact.id)
      )
      .returns<Appointment[]>()

    // Transformer les données pour inclure le statut de rendez-vous
    const formattedContacts: ContactWithAppointment[] = contacts.map((item: ListContact) => ({
      ...item.contact,
      has_appointment: appointments?.some((a: Appointment) => a.contact_id === item.contact.id) || false
    }))

    return NextResponse.json(formattedContacts)
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 