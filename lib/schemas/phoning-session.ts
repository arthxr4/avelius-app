// lib/schemas/phoning-session.ts
import { z } from "zod"

export const phoningSessionSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  created_by: z.string().nullable(),
  title: z.string(),
  status: z.enum(["draft", "in_progress", "done"]),
  date: z.string(),
  created_at: z.string(),
})

export type PhoningSession = z.infer<typeof phoningSessionSchema>
