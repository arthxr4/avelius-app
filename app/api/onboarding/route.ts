import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FileData {
  name: string
  type: string
  data: string
}

interface OnboardingRequest {
  clientId: string
  formData: Record<string, string | boolean>
  files: Record<string, FileData>
}

export async function POST(request: Request) {
  try {
    const { clientId, formData, files } = (await request.json()) as OnboardingRequest

    // Upload files first
    for (const [fieldId, fileData] of Object.entries(files)) {
      const { name, type, data } = fileData
      const filePath = `onboarding/${clientId}/${fieldId}/${name}`

      // Convert base64 to buffer
      const buffer = Buffer.from(data.split(",")[1], "base64")

      const { error: uploadError } = await supabase.storage
        .from("onboarding")
        .upload(filePath, buffer, {
          contentType: type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from("onboarding")
        .getPublicUrl(filePath)

      formData[fieldId] = publicUrl
    }

    // Get existing responses
    const { data: existingResponses } = await supabase
      .from("onboarding_responses")
      .select("*")
      .eq("client_id", clientId)

    // Update or create responses
    for (const [fieldId, value] of Object.entries(formData)) {
      const existingResponse = existingResponses?.find(
        (r) => r.field_id === fieldId
      )

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from("onboarding_responses")
          .update({ value: value.toString() })
          .eq("id", existingResponse.id)

        if (error) throw error
      } else {
        // Create new response
        const { error } = await supabase
          .from("onboarding_responses")
          .insert({
            client_id: clientId,
            field_id: fieldId,
            value: value.toString(),
          })

        if (error) throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving onboarding data:", error)
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    )
  }
} 