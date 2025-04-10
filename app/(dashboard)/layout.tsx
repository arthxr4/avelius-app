// app/(dashboard)/layout.tsx
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import type { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <BreadcrumbNav />
          <div className="ml-auto">
            <UserButton />
          </div>
        </header>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
