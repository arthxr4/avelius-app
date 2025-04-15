import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(request: Request) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")
    const contactId = searchParams.get("contact_id")
    const date = searchParams.get("date")

    if (!clientId || !contactId || !date) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier les rendez-vous sur la même journée
    const startDate = startOfDay(new Date(date))
    const endDate = endOfDay(new Date(date))

    const { data, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("client_id", clientId)
      .eq("contact_id", contactId)
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .limit(1)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      )
    }

    return NextResponse.json({ exists: data.length > 0 })
  } catch (error) {
    console.error("Error checking appointment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 