import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerSupabaseClient()

  try {
    // Utiliser une sous-requête pour compter les membres par client
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id,
        members:client_members(count)
      `)

    if (error) {
      console.error("Error fetching members count:", error)
      return NextResponse.json(
        { error: "Failed to fetch members count" },
        { status: 500 }
      )
    }

    // Transform the data into a more usable format
    const membersCount = data.reduce((acc: Record<string, number>, curr) => {
      acc[curr.id] = (curr.members as any[])?.[0]?.count ?? 0
      return acc
    }, {})

    return NextResponse.json(membersCount)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}