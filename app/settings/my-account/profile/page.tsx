"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  CardWithDividers,
  CardWithDividersHeader,
  CardWithDividersTitle,
  CardWithDividersDescription,
  CardWithDividersContent,
  CardWithDividersFooter,
} from "@/components/ui/card-with-dividers"
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
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit faire au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
})

export default function ProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  })

  const isAvatarChanged = avatarUrl !== initialAvatarUrl
  const hasChanges = form.formState.isDirty || isAvatarChanged

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/settings/profile")
        const data = await response.json()

        form.reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
        })

        setAvatarUrl(data.avatar_url)
        setInitialAvatarUrl(data.avatar_url)
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Erreur lors du chargement du profil")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB")
        return
      }

      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl)
      }
      const newLocalUrl = URL.createObjectURL(file)
      setAvatarUrl(newLocalUrl)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      const { url } = await response.json()
      setAvatarUrl(url)
      toast.success("Photo de profil mise à jour")
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Erreur lors de l'upload de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: form.getValues("first_name"),
          last_name: form.getValues("last_name"),
          avatar_url: null,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'avatar")
      }

      setAvatarUrl(null)
      setInitialAvatarUrl(null)
      toast.success("Photo de profil supprimée")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la suppression de l'avatar")
    } finally {
      setIsDeleting(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          avatar_url: avatarUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du profil")
      }

      setInitialAvatarUrl(avatarUrl)
      form.reset(values)
      toast.success("Profil mis à jour avec succès")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      

      <CardWithDividers>
        <CardWithDividersHeader>
          <CardWithDividersTitle>
            Profil
          </CardWithDividersTitle>
          <CardWithDividersDescription>
            Gérez les paramètres de votre profil Avelius.
          </CardWithDividersDescription>
        </CardWithDividersHeader>
        <Separator />
        {isLoading ? (
          <>
            <CardWithDividersContent>
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-[72px] w-[72px] rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-36" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </CardWithDividersContent>
            <Separator />
            <CardWithDividersFooter>
              <Skeleton className="h-10 w-28" />
            </CardWithDividersFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardWithDividersContent>
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-[72px] w-[72px]">
                      <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                      <AvatarFallback>
                        {form.getValues("first_name")?.[0]}
                        {form.getValues("last_name")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="mb-1 text-sm font-medium">Photo de profil</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="relative"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Upload en cours...
                            </>
                          ) : (
                            "Télécharger un avatar"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive"
                          onClick={handleDeleteAvatar}
                          disabled={!avatarUrl || isUploading || isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Suppression...
                            </>
                          ) : (
                            "Supprimer"
                          )}
                        </Button>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>
              </CardWithDividersContent>
              <Separator />
              <CardWithDividersFooter>
                <Button type="submit" disabled={isSubmitting || !hasChanges}>
                  {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
                </Button>
              </CardWithDividersFooter>
            </form>
          </Form>
        )}
      </CardWithDividers>
    </>
  )
} 