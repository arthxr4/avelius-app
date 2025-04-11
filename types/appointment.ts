export type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
}

export type Appointment = {
  id: string
  client_id: string
  contact_id: string
  session_id: string
  date: string
  status: string
  added_by: string
  created_at: string
  contacts: Contact
} 