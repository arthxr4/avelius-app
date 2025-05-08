import React from "react"

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  done: { label: "Terminé", bg: "bg-green-100", text: "text-green-600" },
  confirmed: { label: "Confirmé", bg: "bg-blue-100", text: "text-blue-600" },
  canceled: { label: "Annulé", bg: "bg-red-100", text: "text-red-600" },
  reprogrammed: { label: "Reporté", bg: "bg-orange-100", text: "text-orange-600" },
  no_show: { label: "Non présenté", bg: "bg-red-100", text: "text-red-600" },
}

export function BadgeSimple({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600" }
  return (
    <span className={`inline-block rounded-md px-3 py-1 text-[13px] font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
} 