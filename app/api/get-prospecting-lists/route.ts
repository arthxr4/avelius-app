// app/api/get-prospecting-lists/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")

    if (!clientId) {
      return new NextResponse("Client ID is required", { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer les listes avec le comptage des contacts
    const { data, error } = await supabase
      .from("prospecting_lists")
      .select(`
        *,
        contacts:prospecting_list_contacts(count)
      `)
      .eq("client_id", clientId)

    if (error) {
      console.error("Error:", error)
      return new NextResponse("Error fetching lists", { status: 500 })
    }

    // Transformer les données pour avoir un format plus simple
    const transformedData = data.map(list => ({
      ...list,
      contacts_count: list.contacts?.[0]?.count || 0
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
