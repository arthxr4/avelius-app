"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { type Contact } from "@/lib/schemas/contact"

export const columns: ColumnDef<Contact>[] = [
  {
    id: "full_name",
    header: "Nom complet",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.first_name} {row.original.last_name}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
  },
  {
    accessorKey: "company",
    header: "Entreprise",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.status.replace("_", " ")}
      </span>
    ),
  },
]
