"use client"

import type * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Calendar,
  Home,
  ListChecks,
  FileText,
  CalendarDays,
  LayoutDashboard,
  ActivitySquare,
  Briefcase,
  Users2,
  Gauge,
  House,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from "react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useTeam } from "@/lib/team-context"
import { useIsAdmin } from "@/lib/hooks/use-is-admin"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { current } = useTeam()
  const { user: clerkUser } = useUser()
  const { isAdmin, isLoading } = useIsAdmin()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const clientLinks = [
    {
      title: "Vue d'ensemble",
      url: current?.id ? `/clients/${current.id}` : "#",
      icon: House,
    },
    {
      title: "Rendez-vous",
      url: current?.id ? `/clients/${current.id}/meetings` : "#",
      icon: CalendarDays,
    },
    {
      title: "Listes de prospection",
      url: current?.id ? `/clients/${current.id}/prospecting-lists` : "#",
      icon: ListChecks,
    },
    {
      title: "Details & docs",
      url: current?.id ? `/clients/${current.id}/details` : "#",
      icon: FileText,
    },
  ]
  
  const navProjects = [
    {
      name: "Cockpit",
      url: "/admin/overview",
      icon: Gauge,
    },
    {
      name: "Clients",
      url: "/admin/clients",
      icon: Briefcase,
    },
    {
      name: "Équipe interne",
      url: "/admin/members",
      icon: Users2,
    },
  ].filter(Boolean)

  const user = {
    name: clerkUser ? `${clerkUser.firstName} ${clerkUser.lastName}` : "",
    email: clerkUser?.emailAddresses[0]?.emailAddress || "",
    avatar: clerkUser?.imageUrl || "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-shrink-0">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <NavMain items={clientLinks} />
          {/* Affiche un loader si on ne sait pas encore si l'utilisateur est admin */}
          {isLoading ? (
            <div className="px-3 py-2 animate-pulse text-xs text-muted-foreground"></div>
          ) : isAdmin ? (
            <NavProjects projects={navProjects} />
          ) : null}
        </div>
      </SidebarContent>
      <SidebarFooter className="flex-shrink-0">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
