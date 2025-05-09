"use client"

import { useTeam } from "@/lib/team-context"

export default function ClientDashboard() {
  const { current } = useTeam()

  if (!current) {
    return <p className="p-6 text-muted-foreground">Aucun client sélectionné</p>
  }

  async function createClientTest() {
    const res = await fetch("/api/create-client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Client test via bouton" }),
      credentials: "include", // 👈 super important pour envoyer les cookies Clerk
    })

    const data = await res.json()
    alert("✅ Réponse : " + JSON.stringify(data))
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Dashboard de {current.name}</h2>
      <p>Domaine : {current.domain ?? "Non spécifié"}</p>

      {/* Tu pourras ensuite ajouter ici un composant qui fetch les LEADS liés */}

      <button
        onClick={createClientTest}
        className="mt-6 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
      >
        ➕ Créer client test (via bouton)
      </button>

    </div>
  )
}
