import { useTeam } from "@/lib/team-context"

export function useCurrentClient() {
  const { current } = useTeam()
  return { current }
} 