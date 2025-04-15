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
} from "lucide-react"
import { useUser } from "@clerk/nextjs"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { current } = useTeam()
  const { user: clerkUser } = useUser()

  const clientLinks = [
    {
      title: "Vue d'ensemble",
      url: current?.id ? `/clients/${current.id}` : "#",
      icon: Home,
    },
    {
      title: "Rendez-vous",
      url: current?.id ? `/clients/${current.id}/meetings` : "#",
      icon: Calendar,
    },
    {
      title: "Listes de prospection",
      url: current?.id ? `/clients/${current.id}/prospecting-lists` : "#",
      icon: ListChecks,
    },
  ]
  

  const navProjects = [
    {
      name: "Clients",
      url: "/admin/clients-manager",
      icon: PieChart,
    },
    {
      name: "Members",
      url: "/admin/members",
      icon: Map,
    },
  ].filter(Boolean) // 🔥 on enlève les "false" si `current` est null

  const user = {
    name: clerkUser ? `${clerkUser.firstName} ${clerkUser.lastName}` : "",
    email: clerkUser?.emailAddresses[0]?.emailAddress || "",
    avatar: clerkUser?.imageUrl || "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={clientLinks} />
        <NavProjects projects={navProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
