import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const fieldId = searchParams.get('fieldId')
    const fileName = searchParams.get('fileName')

    if (!clientId || !fieldId || !fileName) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const filePath = `onboarding/${clientId}/${fieldId}/${fileName}`

    const { error } = await supabase.storage
      .from("onboarding-docs")
      .remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE route:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
} 