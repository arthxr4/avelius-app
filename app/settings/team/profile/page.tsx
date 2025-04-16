"use client"

import { useEffect, useState } from "react"
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
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
})

export default function TeamProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [onboardingFields, setOnboardingFields] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch team data
        const teamResponse = await fetch("/api/settings/team")
        const teamData = await teamResponse.json()
        
        form.reset({
          name: teamData.name || "",
        })

        // Fetch onboarding fields
        const onboardingResponse = await fetch("/api/get-onboarding-fields")
        const onboardingData = await onboardingResponse.json()
        setOnboardingFields(onboardingData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/settings/team", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'équipe")
      }

      form.reset(values)
      toast.success("Équipe mise à jour avec succès")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la mise à jour de l'équipe")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CardWithDividers>
      <CardWithDividersHeader>
        <CardWithDividersTitle>
          Profil de l'équipe
        </CardWithDividersTitle>
        <CardWithDividersDescription>
          Gérez les informations et les paramètres de votre équipe.
        </CardWithDividersDescription>
      </CardWithDividersHeader>
      <Separator />
      {isLoading ? (
        <>
          <CardWithDividersContent>
            <div className="space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'équipe</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon équipe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {onboardingFields.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Champs d'onboarding</h3>
                    <div className="space-y-2">
                      {onboardingFields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          {field.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardWithDividersContent>
            <Separator />
            <CardWithDividersFooter>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isDirty}
              >
                {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
              </Button>
            </CardWithDividersFooter>
          </form>
        </Form>
      )}
    </CardWithDividers>
  )
} 