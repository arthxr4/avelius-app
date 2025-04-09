import { getSessionContacts } from "@/lib/api/get-session-contacts"
import { notFound } from "next/navigation"
import { SessionContactsTable } from "@/components/phoning/session-contacts-table"
import { headers } from "next/headers"

type Props = {
  params: {
    id: string
    session_id: string
  }
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

interface Session {
  id: string
  title: string
  date: string
  status: string
  contacts: Contact[]
}

interface RawSessionData {
  id: string
  title: string
  date: string
  status: string
  contacts: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    company: string
  }[]
}

export default async function PhoningSessionDetailsPage({ params }: Props) {
  const { id, session_id } = params
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"

  const sessionData = await getSessionContacts(session_id) as RawSessionData | null
  if (!sessionData) return notFound()

  const session: Session = {
    id: sessionData.id,
    title: sessionData.title,
    date: sessionData.date,
    status: sessionData.status,
    contacts: sessionData.contacts
  }

  console.log("➡️ Params reçus :", params)

  // Récupérer les rendez-vous pour cette session
  const response = await fetch(
    `${protocol}://${host}/api/get-appointments-by-session?session_id=${session_id}`,
    { 
      cache: "no-store",
      headers: {
        'authorization': headersList.get('authorization') || '',
        'cookie': headersList.get('cookie') || ''
      }
    }
  )
  const appointments = await response.json()
  
  console.log("🔍 Session ID:", session_id)
  console.log("📊 Appointments fetched:", appointments?.length || 0)
  console.log("📊 First appointment:", appointments?.[0])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <p className="text-sm text-muted-foreground">
          Session du {new Date(session.date).toLocaleDateString("fr-FR")} - {session.status}
        </p>
      </div>

      <SessionContactsTable
        data={session.contacts}
        clientId={id}
        sessionId={session_id}
        appointments={appointments}
      />
    </div>
  )
}
