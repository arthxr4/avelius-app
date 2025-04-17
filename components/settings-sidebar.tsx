import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, User2, Shield, Users, ArrowLeft } from "lucide-react"
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
    icon: User2,
    items: [
      {
        title: "Profil",
        href: "/settings/my-account/profile",
      },
    ],
  },
  {
    title: "Sécurité",
    icon: Shield,
    items: [
      {
        title: "Paramètres de sécurité",
        href: "/settings/security",
      },
    ],
  },
  {
    title: "Équipe",
    icon: Users,
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
      <SidebarHeader className="px-0 py-2">
        <div className="px-1 py-3">
          <Link href="/dashboard" className="w-full">
            <Button variant="ghost" className="w-full justify-start gap-2 px-3">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarNavItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>
              <div className="flex items-center gap-2 text-sm">
                <section.icon className="h-4 w-4" />
                {section.title}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href} className="pl-6">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="font-medium"
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