import { createClient } from "@supabase/supabase-js"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

interface OnboardingField {
  id: string
  label: string
  type: string
  required: boolean
  created_at: string
  section: 'company' | 'targeting' | 'pitch' | 'resources' | 'tech' | 'confirm'
}

interface OnboardingResponse {
  id: string
  client_id: string
  field_id: string
  value: string
  created_at: string
  updated_at: string
}

export default async function ClientDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch onboarding fields
  const { data: fields, error: fieldsError } = await supabase
    .from("onboarding_fields")
    .select("*")
    .order("created_at", { ascending: true })

  if (fieldsError) {
    console.error("Error fetching onboarding fields:", fieldsError)
    throw new Error("Failed to fetch onboarding fields")
  }

  // Fetch existing responses for this client
  const { data: responses, error: responsesError } = await supabase
    .from("onboarding_responses")
    .select("*")
    .eq("client_id", params.id)

  if (responsesError) {
    console.error("Error fetching onboarding responses:", responsesError)
    throw new Error("Failed to fetch onboarding responses")
  }

  return (
    <div className="container mx-auto space-y-4 p-2 sm:py-4 lg:px-6 pb-20 md:pb-4">
      <div className="">
          <h1 className="text-xl font-bold">Informations générales</h1>
          <p className="text-sm text-muted-foreground">
            Détaillez les informations à savoir sur votre entreprise  
          </p>
        </div>
      <OnboardingForm
        clientId={params.id}
        fields={fields}
        responses={responses}
      />
    </div>
  )
}
