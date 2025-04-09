"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (isLoaded && userId) {
      setRedirecting(true)
      router.push("/dashboard")
    }
  }, [isLoaded, userId, router])

  if (!isLoaded || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold">Bienvenue sur l'app</h1>
      <p className="max-w-md text-muted-foreground">
        Application cold call avec tableau de bord, sidebar dynamique et authentification Clerk.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/sign-in">Connexion</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-up">Créer un compte</Link>
        </Button>
      </div>
    </div>
  )
}
