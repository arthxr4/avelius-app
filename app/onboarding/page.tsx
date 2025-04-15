"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ImageIcon, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit faire au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
})

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userData, setUserData] = useState<{
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rediriger si l'utilisateur a déjà fait son onboarding
  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const response = await fetch("/api/check-first-login")
        const data = await response.json()
        
        if (!data.isFirstLogin) {
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking first login:", error)
      }
    }

    checkFirstLogin()
  }, [router])

  // Nettoyer l'URL locale à la destruction du composant
  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl)
      }
    }
  }, [avatarUrl])

  // Récupérer les données utilisateur depuis Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses[0]?.emailAddress) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, avatar_url')
          .eq('email', user.emailAddresses[0].emailAddress)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
          return
        }

        if (data) {
          // Générer une URL signée si nous avons un avatar_url
          let fullAvatarUrl = data.avatar_url
          if (data.avatar_url) {
            const path = data.avatar_url.includes('avatars/') 
              ? data.avatar_url.split('avatars/')[1]
              : data.avatar_url

            const { data: signedData } = await supabase.storage
              .from('avatars')
              .createSignedUrl(path, 60 * 60 * 24)

            if (signedData) {
              fullAvatarUrl = signedData.signedUrl
            }
          }

          setUserData({
            ...data,
            avatar_url: fullAvatarUrl
          })

          // Pré-remplir le formulaire avec les données existantes
          form.reset({
            first_name: data.first_name || user.firstName || "",
            last_name: data.last_name || user.lastName || "",
          })

          setAvatarUrl(fullAvatarUrl)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchUserData()
  }, [user?.emailAddresses])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // Vérifier le type et la taille du fichier
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image")
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast.error("L'image ne doit pas dépasser 5MB")
        return
      }

      // Afficher immédiatement l'image en local
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl)
      }
      const newLocalUrl = URL.createObjectURL(file)
      setAvatarUrl(newLocalUrl)

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const userFolder = `users/${user?.id}`
      const fileName = `${userFolder}/avatar-${Date.now()}.${fileExt}`

      // Supprimer l'ancienne photo si elle existe
      if (userData?.avatar_url) {
        try {
          const oldPath = userData.avatar_url.includes('avatars/') 
            ? userData.avatar_url.split('avatars/')[1]
            : userData.avatar_url

          await supabase.storage
            .from('avatars')
            .remove([oldPath])
        } catch (error) {
          console.error("Erreur lors de la suppression de l'ancienne photo:", error)
          // On continue même si la suppression échoue
        }
      }

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error("Erreur Supabase:", error)
        throw error
      }

      // Obtenir l'URL signée
      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60 * 24) // URL valide 24h

      if (signedData) {
        setAvatarUrl(signedData.signedUrl)
        // Mettre à jour userData avec la nouvelle URL
        setUserData(prev => prev ? {
          ...prev,
          avatar_url: signedData.signedUrl
        } : null)
      }

      toast.success("Photo de profil mise à jour")
    } catch (error: any) {
      console.error("Erreur détaillée:", error)
      toast.error(error.message || "Erreur lors de l'upload de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          avatar_url: avatarUrl || user?.imageUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du profil")
      }

      toast.success("Profil mis à jour avec succès")
      router.push("/")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Bienvenue sur Avelius</CardTitle>
          <CardDescription>
            Nous avons juste besoin de quelques informations pour configurer votre profil.
            Vous pourrez modifier cela plus tard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={avatarUrl || user?.imageUrl} 
                alt="Avatar"
              />
              <AvatarFallback>
                {form.getValues("first_name")?.[0]}
                {form.getValues("last_name")?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="h-auto py-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choisir une photo
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG • Max 5MB
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Commencer"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 