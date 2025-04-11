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
} from "lucide-react"

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

  const navMain = [
    {
      title: "Dashboard",
      url: current?.id ? `/clients/${current.id}` : "#",
      icon: SquareTerminal,
    },
    {
      title: "Contacts",
      url: current?.id ? `/clients/${current.id}/prospects` : "#",
      icon: Bot,
    },
    {
      title: "Sessions de phoning",
      url: current?.id ? `/clients/${current.id}/phoning-sessions` : "#",
      icon: AudioWaveform,
    },
    {
      title: "Rendez-vous",
      url: current?.id ? `/clients/${current.id}/meetings` : "#",
      icon: Calendar,
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
      url: "/members",
      icon: Map,
    },
  ].filter(Boolean) // 🔥 on enlève les "false" si `current` est null

  const user = {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={navProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
