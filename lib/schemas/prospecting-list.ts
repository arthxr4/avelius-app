// lib/schemas/prospecting-list.ts
import { z } from "zod"

export const prospectingListSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  client_id: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  contacts_count: z.number().optional(),
})

export type ProspectingList = z.infer<typeof prospectingListSchema>
