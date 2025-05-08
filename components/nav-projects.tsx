"use client"

import { Folder, Forward, MoreHorizontal, Trash2, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton tooltip={item.name} asChild isActive={pathname === item.url}>
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 border border-transparent text-sm font-medium tracking-tight transition-colors",
                  pathname === item.url
                    ? "bg-muted text-sidebar-foreground border-border [&>svg]:text-sidebar-foreground"
                    : "text-sidebar-foreground/70 [&>svg]:text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground hover:[&>svg]:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 text-inherit !text-inherit" />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

