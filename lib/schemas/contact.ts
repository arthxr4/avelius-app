import { z } from "zod"

export const contactSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export type Contact = z.infer<typeof contactSchema>
