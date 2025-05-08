"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Check, Building, UserPlus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { createBrowserClient } from '@supabase/ssr'
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
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { current, setCurrent, teams, isLoading } = useTeam()
  const router = useRouter()
  const pathname = usePathname()
  const { user: clerkUser } = useUser()
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const filteredTeams = React.useMemo(() => {
    if (!searchQuery) return teams
    return teams.filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [teams, searchQuery])

  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (!clerkUser?.emailAddresses[0]?.emailAddress) return
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', clerkUser.emailAddresses[0].emailAddress)
        .single()

      if (data && !error) {
        setIsAdmin(data.role === 'admin')
      }
    }

    fetchUserRole()
  }, [clerkUser?.emailAddresses])

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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building className="size-5" />
              </div>
              <span className="flex-1 truncate text-left text-sm font-semibold">
                {current.name}
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-96 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="px-2 py-2">
              <Input
                placeholder="Rechercher un client..."
                className="h-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {filteredTeams.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  Aucun client trouvé
                </div>
              ) : (
                filteredTeams.map((team, index) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleSelect(team)}
                    className={cn(
                      "gap-2 p-2",
                      current?.id === team.id && "bg-blue-50 hover:bg-blue-100"
                    )}
                  >
                    <div className="flex size-8 items-center justify-center rounded-sm border bg-blue-50 text-blue-600">
                      <Building className="size-5" />
                    </div>
                    <span className="font-medium">{team.name}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-2">
              <Button className="w-full">
                Créer une nouvelle équipe
              </Button>
              <Button className="w-full" variant="secondary">
                Inviter dans votre équipe
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
