"use client"
import { useEffect, useState } from "react"
import AppLoading from "@/components/AppLoading"

const MIN_LOADING_TIME = 600 // ms

export default function ClientLoaderWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      // Masquer le AppLoading SSR
      const ssrLoader = document.getElementById("ssr-app-loader")
      if (ssrLoader) ssrLoader.style.display = "none"
    }, MIN_LOADING_TIME)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return null // On laisse le AppLoading SSR visible
  return <>{children}</>
} 