"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton tooltip={item.title} asChild isActive={pathname === item.url}>
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-colors",
                  pathname === item.url
                    ? "bg-muted text-sidebar-foreground [&>svg]:text-sidebar-foreground"
                    : "text-sidebar-foreground/70 [&>svg]:text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground hover:[&>svg]:text-sidebar-foreground"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 text-inherit !text-inherit" />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
