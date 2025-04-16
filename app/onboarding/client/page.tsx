"use client"

import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

interface OnboardingField {
  id: string
  name: string
  label: string
  type: "text" | "email" | "phone" | "textarea"
  required: boolean
  placeholder?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const createDynamicSchema = (fields: OnboardingField[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {}
  
  fields.forEach((field) => {
    let validation = z.string()

    if (field.type === "email") {
      validation = z.string().email("Email invalide")
    } else if (field.type === "phone") {
      validation = z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Numéro de téléphone invalide")
    }

    schemaFields[field.name] = field.required 
      ? validation.min(1, `${field.label} est requis`)
      : validation.optional()
  })
  
  return z.object(schemaFields)
}

export default function ClientOnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fields, setFields] = useState<OnboardingField[]>([])
  const [formSchema, setFormSchema] = useState<z.ZodObject<any>>(z.object({}))
  
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/get-onboarding-fields")
        const data = await response.json()
        setFields(data)
        setFormSchema(createDynamicSchema(data))
      } catch (error) {
        console.error("Error fetching onboarding fields:", error)
        toast.error("Erreur lors du chargement des champs d'onboarding")
      }
    }

    fetchFields()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.emailAddresses[0]?.emailAddress) return
    
    try {
      setIsSubmitting(true)

      // Créer le client dans Supabase
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          ...values,
          user_id: user.id,
          email: user.emailAddresses[0].emailAddress,
        }])
        .select()
        .single()

      if (clientError) throw clientError

      // Mettre à jour le statut d'onboarding
      const { error: userError } = await supabase
        .from('users')
        .update({ has_completed_client_onboarding: true })
        .eq('email', user.emailAddresses[0].emailAddress)

      if (userError) throw userError

      toast.success("Profil client créé avec succès !")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Une erreur est survenue lors de la création du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Créez votre profil client</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour commencer à utiliser la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea
                            placeholder={field.placeholder}
                            {...formField}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...formField}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer mon profil"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 