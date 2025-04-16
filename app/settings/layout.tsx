"use client"

import { SettingsSidebar } from "@/components/settings-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { ReactNode } from "react"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full">
        <SettingsSidebar />
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-[820px] p-8">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 