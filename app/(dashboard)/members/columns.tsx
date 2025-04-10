"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export type Member = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: "admin" | "agent"
  invited: boolean
  status: string | null
  accepted_at: string | null
  first_login: string | null
  created_at: string
  updated_at: string
}

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "email",
    header: "Utilisateur",
    cell: ({ row }) => {
      const first_name = row.original.first_name || ""
      const last_name = row.original.last_name || ""
      const initials = first_name && last_name 
        ? `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase()
        : row.original.email.charAt(0).toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            {(first_name || last_name) && (
              <div className="font-medium">
                {[first_name, last_name].filter(Boolean).join(" ")}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => {
      const role = row.getValue("role") as "admin" | "agent"
      const label = role === "admin" ? "Admin" : "Agent"
      const variant = role === "admin" ? "default" : "secondary"

      return (
        <Badge variant={variant}>
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.original.status
      const invited = row.original.invited
      let label = "Actif"
      let variant: "default" | "secondary" | "outline" = "default"

      if (invited && !row.original.accepted_at) {
        label = "Invitation en attente"
        variant = "outline"
      } else if (status === "inactive") {
        label = "Inactif"
        variant = "secondary"
      }

      return (
        <Badge variant={variant}>
          {label}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(member.email)}
            >
              Copier l'email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // TODO: Implémenter la modification du rôle
                console.log("Modifier le rôle de", member.email)
              }}
            >
              Modifier le rôle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                // TODO: Implémenter la suppression
                console.log("Supprimer", member.email)
              }}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 