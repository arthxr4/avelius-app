import { currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const client_id = searchParams.get('client_id')

  if (!client_id) {
    return NextResponse.json({ error: "Client ID requis" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Récupérer les rendez-vous
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", client_id)

  if (appointmentsError) {
    console.error("❌ Supabase error:", appointmentsError.message)
    return NextResponse.json({ error: appointmentsError.message }, { status: 500 })
  }

  // Récupérer les contacts
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("*")
    .eq("client_id", client_id)

  if (contactsError) {
    console.error("❌ Supabase error:", contactsError.message)
    return NextResponse.json({ error: contactsError.message }, { status: 500 })
  }

  // Calculer les analytics
  const now = new Date()
  const pastAppointments = appointments.filter(
    (app: { date: string }) => new Date(app.date) < now
  )
  const noShowAppointments = pastAppointments.filter(
    (app: { status: string }) => app.status === "no_show"
  )
  const noShowRate = pastAppointments.length > 0
    ? (noShowAppointments.length / pastAppointments.length) * 100
    : 0

  return NextResponse.json({
    totalAppointments: appointments.length,
    totalProspects: contacts.length,
    noShowRate,
  })
} 