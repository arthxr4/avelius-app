// app/(dashboard)/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { NavUser } from "@/components/nav-user"
import { OrganizationSwitcher, useUser } from "@clerk/nextjs"
import { Settings, LayoutDashboard, CalendarDays, ListChecks, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTeam } from "@/lib/team-context"
import type { ReactNode } from "react"

// Composant qui gère la réactivité de la sidebar
function ResponsiveSidebar() {
  const { setOpen } = useSidebar()

  useEffect(() => {
    // Fonction pour gérer le redimensionnement
    const handleResize = () => {
      const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches // lg breakpoint
      const isMediumScreen = window.matchMedia('(min-width: 768px)').matches // md breakpoint
      
      if (isLargeScreen) {
        setOpen(true) // expanded sur lg
      } else if (isMediumScreen) {
        setOpen(false) // collapsed sur md
      }
    }

    // Appliquer la configuration initiale
    handleResize()

    // Ajouter l'écouteur d'événement
    window.addEventListener('resize', handleResize)

    // Nettoyer l'écouteur
    return () => window.removeEventListener('resize', handleResize)
  }, [setOpen])

  return null
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const { user: clerkUser } = useUser()
  const { current } = useTeam()

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        // Ne pas vérifier sur la page d'onboarding
        if (pathname === "/onboarding") {
          setIsChecking(false)
          return
        }

        const response = await fetch("/api/check-first-login")
        const data = await response.json()
        
        if (data.isFirstLogin) {
          router.push("/onboarding")
        }
      } catch (error) {
        console.error("Error checking first login:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkFirstLogin()
  }, [router, pathname])

  if (isChecking) {
    return null // ou un loader si vous préférez
  }

  return (
    <SidebarProvider>
      <ResponsiveSidebar />
      <AppSidebar />
      <SidebarInset>
        <header className="bg-muted border-subtle sticky top-0 z-40 flex w-full items-center justify-between border-b bg-opacity-50 px-4 py-1.5 backdrop-blur-lg sm:p-4 md:hidden">
          <div className="flex items-center gap-4">
            
            <Image 
              src="/logo.svg" 
              alt="Avelius" 
              width={100} 
              height={24} 
              className="h-6 w-auto"
            />
          </div>
          <div className="flex items-center gap-2 self-center">
          <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <OrganizationSwitcher />
            <NavUser 
              avatarOnly
              user={{
                name: clerkUser ? `${clerkUser.firstName} ${clerkUser.lastName}` : "",
                email: clerkUser?.emailAddresses[0]?.emailAddress || "",
                avatar: clerkUser?.imageUrl || "",
              }}
            />
          </div>
        </header>
        
        <div className="flex flex-col gap-4">
          {children}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
          <div className="flex items-center justify-around">
            {[
              {
                href: current?.id ? `/clients/${current.id}` : "#",
                icon: LayoutDashboard,
                label: "Vue d'ensemble"
              },
              {
                href: current?.id ? `/clients/${current.id}/meetings` : "#",
                icon: CalendarDays,
                label: "Rendez-vous"
              },
              {
                href: current?.id ? `/clients/${current.id}/prospecting-lists` : "#",
                icon: ListChecks,
                label: "Listes"
              },
              {
                href: current?.id ? `/clients/${current.id}/details` : "#",
                icon: FileText,
                label: "Détails & Docs"
              },
            ].map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "flex-1 flex-col items-center justify-center gap-1 py-3 h-auto",
                    isActive && "bg-accent"
                  )}
                  onClick={() => router.push(item.href)}
                  disabled={item.href === "#"}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  )
}
