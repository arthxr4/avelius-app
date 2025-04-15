// app/(dashboard)/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { UserMenu } from "@/components/user-menu"
import type { ReactNode } from "react"

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
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <BreadcrumbNav />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
