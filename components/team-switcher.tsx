"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTeam } from "@/lib/team-context"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { current, setCurrent, teams, isLoading } = useTeam()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    // 🧠 extrait le client_id depuis l'URL si présent
    const clientIdInUrl = pathname.match(/\/clients\/([^/]+)/)?.[1]

    if (clientIdInUrl && teams.length > 0) {
      // 👇 Si un client est présent dans l'URL, on le sélectionne
      const fromUrl = teams.find((c) => c.id === clientIdInUrl)

      if (fromUrl && (!current || current.id !== fromUrl.id)) {
        setCurrent(fromUrl)
      }
    }
  }, [pathname, teams])

  const handleSelect = (team: { id: string; name: string }) => {
    setCurrent(team)
  
    if (pathname.startsWith("/clients")) {
      // Si on est déjà sur une page client (ex: prospects, dashboard), on remplace le client_id dans l'URL
      const newPath = pathname.replace(
        /\/clients\/([^/]+)/,
        `/clients/${team.id}`
      )
  
      if (newPath !== pathname) {
        router.push(newPath)
      }
    } else if (!pathname.startsWith("/members")) {
      // Sinon, rediriger vers la racine client
      router.push(`/clients/${team.id}`)
    }
  }

  if (!teams.length && isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="gap-4">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!current || !current.name) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            Aucun client
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {current.name.charAt(0)}
              </div>
              <span className="flex-1 truncate text-left text-sm font-semibold">
                {current.name}
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Sélection du client
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSelect(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-muted text-muted-foreground">
                  {team.name.charAt(0)}
                </div>
                <span>{team.name}</span>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" disabled>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Ajouter un client</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
