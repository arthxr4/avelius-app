// app/test/page.tsx
import { getClients } from "@/server/airtable"

export default async function TestPage() {
  const clients = await getClients()

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Clients Airtable</h1>
      <ul className="mt-4 space-y-2">
        {clients.map((client) => (
          <li key={client.id} className="rounded bg-muted p-2">
            <strong>{client.name}</strong> — {client.domain ?? "Aucun domaine"}
          </li>
        ))}
      </ul>
    </div>
  )
}
