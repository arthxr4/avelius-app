import Airtable from "airtable"

export async function getClients() {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID
  const tableName = process.env.AIRTABLE_CLIENTS_TABLE

  if (!apiKey || !baseId || !tableName) {
    throw new Error("❌ Airtable env vars manquantes")
  }

  const base = new Airtable({ apiKey }).base(baseId)

  const records = await base(tableName)
    .select({ fields: ["Nom de l'entreprise", "Domaines"] })
    .all()

  return records.map((record) => {
    const domains = record.get("Domaines") as string[] | undefined
    return {
      id: record.id,
      name: record.get("Nom de l'entreprise") as string,
      domain: domains?.[0],
    }
  })
}
