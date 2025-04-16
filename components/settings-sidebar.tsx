import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const sidebarNavItems = [
  {
    title: "Mon compte",
    items: [
      {
        title: "Profil",
        href: "/settings/my-account/profile",
      },
    ],
  },
  {
    title: "Sécurité",
    items: [
      {
        title: "Paramètres de sécurité",
        href: "/settings/security",
      },
    ],
  },
  {
    title: "Équipe",
    items: [
      {
        title: "Profil de l'équipe",
        href: "/settings/team/profile",
      },
      {
        title: "Membres",
        href: "/settings/team/members",
      },
    ],
  },
]

export function SettingsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <div className="px-6 py-3">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 pl-0">
              <ChevronLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarNavItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
} 