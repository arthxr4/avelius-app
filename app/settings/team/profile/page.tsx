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
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
})

interface OnboardingData {
  clientId: string
  fields: any[]
  responses: any[]
}

export default function TeamProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        

        // Fetch onboarding data
        const onboardingResponse = await fetch("/api/settings/team/onboarding")
        const onboardingData = await onboardingResponse.json()
        setOnboardingData(onboardingData)
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
    <div className="space-y-6">
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
                </div>
              </CardWithDividersContent>
              <Separator />
              <CardWithDividersFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isDirty}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Mettre à jour"
                  )}
                </Button>
              </CardWithDividersFooter>
            </form>
          </Form>
        )}
      </CardWithDividers>

      {onboardingData && (
        <OnboardingForm
          clientId={onboardingData.clientId}
          fields={onboardingData.fields}
          responses={onboardingData.responses}
        />
      )}
    </div>
  )
} 