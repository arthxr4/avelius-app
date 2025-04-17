// lib/team-context.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

export type Team = {
  id: string
  name: string
  domain?: string
}

const TeamContext = createContext<{
  current: Team | null
  setCurrent: (team: Team | null) => void
  teams: Team[]
  isLoading: boolean
  error: string | null
}>({
  current: null,
  setCurrent: () => {},
  teams: [],
  isLoading: true,
  error: null
})

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Team | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUser()

  // Load saved team from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem("currentTeam")
    if (saved) {
      try {
        const savedTeam = JSON.parse(saved)
        setCurrent(savedTeam)
      } catch (e) {
        console.error("Error parsing saved team:", e)
        localStorage.removeItem("currentTeam")
      }
    }
  }, [])

  // Persist to localStorage when current changes
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
        setError(null)
        const clientsRes = await fetch("/api/get-clients", { 
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        })

        if (!clientsRes.ok) {
          throw new Error("Erreur lors de la récupération des clients")
        }

        const clients = await clientsRes.json()

        if (!Array.isArray(clients)) {
          throw new Error("Format de réponse invalide")
        }

        const enrichedClients = clients
          .filter((c: { id: string; name: string }) => c.name)
          .map((c: { id: string; name: string; domain?: string }) => ({
            id: c.id,
            name: c.name,
            domain: c.domain
          }))

        setTeams(enrichedClients)

        // Si nous avons des clients et pas de sélection courante, sélectionner le premier
        if (enrichedClients.length > 0 && !current) {
          setCurrent(enrichedClients[0])
        }
      } catch (error) {
        console.error("Error loading clients:", error)
        setError(error instanceof Error ? error.message : "Erreur inconnue")
        // Ne pas effacer les teams en cas d'erreur pour garder l'état précédent
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadTeams()
    } else {
      // Reset state when user is not authenticated
      setTeams([])
      setCurrent(null)
      setError(null)
      setIsLoading(false)
    }
  }, [user]) // Reload teams when user changes

  return (
    <TeamContext.Provider value={{ current, setCurrent, teams, isLoading, error }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => {
  const context = useContext(TeamContext)
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}
