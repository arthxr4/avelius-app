"use client"

import { ChevronsUpDown, CreditCard, LogOut, Settings, User } from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [userData, setUserData] = useState<{
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!clerkUser?.emailAddresses[0]?.emailAddress) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, avatar_url')
          .eq('email', clerkUser.emailAddresses[0].emailAddress)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
          return
        }

        if (data) {
          // Générer une URL signée si nous avons un avatar_url
          let fullAvatarUrl = data.avatar_url
          if (data.avatar_url) {
            // Extraire le chemin relatif de l'URL complète si nécessaire
            const path = data.avatar_url.includes('avatars/') 
              ? data.avatar_url.split('avatars/')[1]
              : data.avatar_url

            const { data: signedData } = await supabase.storage
              .from('avatars')
              .createSignedUrl(path, 60 * 60 * 24) // URL valide 24h

            if (signedData) {
              fullAvatarUrl = signedData.signedUrl
            }
          }

          setUserData({
            ...data,
            avatar_url: fullAvatarUrl
          })
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchUserData()
  }, [clerkUser?.emailAddresses])

  useEffect(() => {
    if (userData) {
      console.log('User data loaded:', {
        name: `${userData.first_name} ${userData.last_name}`,
        avatar: userData.avatar_url
      })
    }
  }, [userData])

  // Use Supabase user data if available, otherwise fall back to Clerk, then to props
  const displayName = userData 
    ? `${userData.first_name} ${userData.last_name}` 
    : clerkUser?.firstName 
      ? `${clerkUser.firstName} ${clerkUser.lastName || ""}` 
      : user.name
  const email = clerkUser?.emailAddresses[0]?.emailAddress || user.email
  const avatarUrl = userData?.avatar_url || clerkUser?.imageUrl || user.avatar

  const handleSignOut = async () => {
    await signOut()
    router.push("/sign-in")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg">{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Mes paramètres
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

