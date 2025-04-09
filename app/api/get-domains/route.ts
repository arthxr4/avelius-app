// app/api/get-domains/route.ts
import { NextResponse } from "next/server"
import Airtable from "airtable"

export const runtime = "nodejs"

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID

  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Missing Airtable config" }, { status: 500 })
  }

  try {
    const base = new Airtable({ apiKey }).base(baseId)

    const records = await base("Domains") // ✅ ici le bon nom
      .select({ fields: ["Domain"] })
      .all()

    const domains = records.map((record) => ({
      id: record.id,
      name: record.get("Domain") as string,
    }))

    return NextResponse.json(domains)
  } catch (error) {
    console.error("Airtable error:", error)
    return NextResponse.json({ error: "Airtable error" }, { status: 500 })
  }
}
