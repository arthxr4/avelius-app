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
  const [current, setCurrent] = useState<Team | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved team from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem("currentTeam")
    if (saved) {
      const savedTeam = JSON.parse(saved)
      setCurrent(savedTeam)
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
        const clientsRes = await fetch("/api/get-clients", { credentials: "include" })
        const clients = await clientsRes.json()

        const enrichedClients = clients
          .filter((c: { id: string; name: string }) => c.name)
          .map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))

        setTeams(enrichedClients)

        // If we have clients and no current selection, select the first one
        if (enrichedClients.length > 0 && !current) {
          setCurrent(enrichedClients[0])
        }
      } catch (error) {
        console.error("Error loading clients:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, []) // Load clients once on mount

  return (
    <TeamContext.Provider value={{ current, setCurrent, teams, isLoading }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
