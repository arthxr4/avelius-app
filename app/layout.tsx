import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from "@clerk/nextjs"
import { TeamProvider } from "@/lib/team-context"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { frFR } from "@clerk/localizations"
import { LoginTracker } from "@/components/login-tracker"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import AppLoading from "@/components/AppLoading"
import ClientLoaderWrapper from "@/components/ClientLoaderWrapper"

import "@/app/globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider 
      localization={frFR}
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-none",
          formButtonPrimary: 
            "bg-primary text-primary-foreground hover:bg-primary/90",
          footerActionLink: "text-primary hover:text-primary/90",
          formFieldInput: "focus:ring-primary",
          identityPreviewEditButton: "text-primary hover:text-primary/90",
          formResendCodeLink: "text-primary hover:text-primary/90",
          otpCodeFieldInput: "focus:ring-primary"
        }
      }}
    >
      <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className={GeistSans.className}>
          <ClientLoaderWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TeamProvider>
                <LoginTracker />
                {children}
                <Toaster />
              </TeamProvider>
            </ThemeProvider>
          </ClientLoaderWrapper>
        </body>
      </html>
    </ClerkProvider>
  )
}