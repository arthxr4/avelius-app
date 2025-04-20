// app/(dashboard)/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { UserMenu } from "@/components/user-menu"
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
        <div className="flex flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
