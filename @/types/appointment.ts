export type ContactNote = {
  id: string
  contact_id: string
  user_id?: string
  content: string
  created_at: string
  updated_at: string
}

export type Contact = {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  id: string
  notes?: ContactNote[]
} 