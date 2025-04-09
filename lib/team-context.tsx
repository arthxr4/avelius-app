// lib/team-context.tsx
"use client"

import { createContext, useContext, useState, useEffect } from "react"

type Team = { id: string; name: string }

const TeamContext = createContext<{
  current: Team | null
  setCurrent: (team: Team | null) => void
  teams: Team[]
  isLoading: boolean
}>({
  current: null,
  setCurrent: () => {},
  teams: [],
  isLoading: true,
})

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Team | null>(() => {
    // On initialise depuis le localStorage si disponible
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("currentTeam")
      return saved ? JSON.parse(saved) : null
    }
    return null
  })
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // On persiste dans le localStorage à chaque changement
  useEffect(() => {
    if (current) {
      localStorage.setItem("currentTeam", JSON.stringify(current))
    } else {
      localStorage.removeItem("currentTeam")
    }
  }, [current])

  useEffect(() => {
    async function loadTeams() {
      try {
        const clientsRes = await fetch("/api/get-clients", { credentials: "include" })
        const clients = await clientsRes.json()

        const enrichedClients = clients
          .filter((c: { id: string; name: string }) => c.name)
          .map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))

        setTeams(enrichedClients)

        // Si on a des clients et qu'aucun n'est sélectionné, on prend le premier
        if (enrichedClients.length > 0 && !current) {
          setCurrent(enrichedClients[0])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, []) // On charge les clients une seule fois au montage

  return (
    <TeamContext.Provider value={{ current, setCurrent, teams, isLoading }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
