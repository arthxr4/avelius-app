import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return new NextResponse("List ID is required", { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Supprimer d'abord les contacts de la liste
    const { error: contactsError } = await supabase
      .from("prospecting_list_contacts")
      .delete()
      .eq("list_id", id)

    if (contactsError) {
      console.error("Error deleting contacts:", contactsError)
      return new NextResponse("Error deleting contacts", { status: 500 })
    }

    // Puis supprimer la liste elle-même
    const { error: listError } = await supabase
      .from("prospecting_lists")
      .delete()
      .eq("id", id)

    if (listError) {
      console.error("Error deleting list:", listError)
      return new NextResponse("Error deleting list", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 