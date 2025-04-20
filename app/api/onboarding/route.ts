import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FileData {
  name: string
  type: string
  data: string
}

interface OnboardingRequest {
  clientId: string
  formData?: Record<string, string | boolean>
  files?: Record<string, FileData>
}

// Liste les fichiers d'un client
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.storage
      .from("onboarding-docs")
      .list(`${clientId}`)

    if (error) {
      console.error("Error listing files:", error)
      throw error
    }

    // Générer des URLs signées pour chaque fichier
    const filesWithUrls = await Promise.all(
      data.map(async (file) => {
        const filePath = `${clientId}/${file.name}`
        const { data: signedData } = await supabase.storage
          .from("onboarding-docs")
          .createSignedUrl(filePath, 3600)

        return {
          ...file,
          signedUrl: signedData?.signedUrl
        }
      })
    )

    return NextResponse.json(filesWithUrls)
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    )
  }
}

// Upload un fichier et/ou met à jour les réponses
export async function POST(request: Request) {
  try {
    const { clientId, formData, files } = (await request.json()) as OnboardingRequest

    // Upload files if any
    if (files) {
      for (const [_, fileData] of Object.entries(files)) {
        const { name, type, data } = fileData
        const filePath = `${clientId}/${name}`

        // Convert base64 to buffer
        const buffer = Buffer.from(data.split(",")[1], "base64")

        const { error: uploadError } = await supabase.storage
          .from("onboarding-docs")
          .upload(filePath, buffer, {
            contentType: type,
            upsert: true,
          })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw uploadError
        }
      }
    }

    // Handle form data if any
    if (formData && Object.keys(formData).length > 0) {
      // Get existing responses
      const { data: existingResponses, error: selectError } = await supabase
        .from("onboarding_responses")
        .select("*")
        .eq("client_id", clientId)

      if (selectError) {
        console.error("Error fetching existing responses:", selectError)
        throw selectError
      }

      // Update or create responses
      for (const [fieldId, value] of Object.entries(formData)) {
        const existingResponse = existingResponses?.find(
          (r) => r.field_id === fieldId
        )

        if (existingResponse) {
          const { error } = await supabase
            .from("onboarding_responses")
            .update({ value: value.toString() })
            .eq("id", existingResponse.id)

          if (error) {
            console.error("Error updating response:", error)
            throw error
          }
        } else {
          const { error } = await supabase
            .from("onboarding_responses")
            .insert({
              client_id: clientId,
              field_id: fieldId,
              value: value.toString(),
            })

          if (error) {
            console.error("Error inserting response:", error)
            throw error
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving data:", error)
    return NextResponse.json(
      { error: "Failed to save data" },
      { status: 500 }
    )
  }
}

// Supprime un fichier
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const fileName = searchParams.get('fileName')

    if (!clientId || !fileName) {
      return NextResponse.json(
        { error: "Client ID and file name are required" },
        { status: 400 }
      )
    }

    const { error } = await supabase.storage
      .from("onboarding-docs")
      .remove([`${clientId}/${fileName}`])

    if (error) {
      console.error("Error deleting file:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
} 