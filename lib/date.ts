import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function formatDate(date: Date) {
  return format(date, "PPP", { locale: fr })
}

export function formatShortDate(date: Date) {
  return format(date, "P", { locale: fr })
} 