"use client"
import { useEffect, useState } from "react"
import AppLoading from "@/components/AppLoading"

export default function ClientLoaderWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) return <AppLoading />
  return <>{children}</>
} 