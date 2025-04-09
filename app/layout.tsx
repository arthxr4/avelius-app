import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { TeamProvider } from "@/lib/team-context"
import { Toaster } from "@/components/ui/sonner"

import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Avelius - L'agence de prospection",
  description: "L'agence de prospection qui vous aide à trouver des clients",
    generator: '  Next.js',
  applicationName: 'Avelius',
  referrer: 'origin-when-cross-origin',
  keywords: ['prospection', 'lead generation', 'marketing'],
  authors: [{ name: 'Avelius' }],
  creator: 'Avelius',
  publisher: 'Avelius',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  openGraph: {
    title: 'Avelius - L\'agence de prospection',
    description: 'L\'agence de prospection qui vous aide à trouver des clients',
    url: 'https://avelius.com',
    siteName: 'Avelius',
    images: [
      {
        url: 'https://avelius.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Avelius - L\'agence de prospection',
        type: 'image/png',
      },
    ],
    locale: 'fr-FR',
    type: 'website',
  },
  }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <Toaster />
      {/* @ts-expect-error Server Component */}
      <TeamProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
      </TeamProvider>
    </ClerkProvider>
  )
}



import './globals.css'