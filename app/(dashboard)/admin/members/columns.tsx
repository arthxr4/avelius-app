"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserCog, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { UpdateRoleDialog } from "@/components/members/update-role-dialog"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Member = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: "admin" | "manager" | "agent"
  invited: boolean
  status: string | null
  accepted_at: string | null
  first_login: string | null
  created_at: string
  updated_at: string
  avatar_url: string | null
  clerk_image_url?: string
}

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const first_name = row.original.first_name || ""
      const last_name = row.original.last_name || ""
      const avatarUrl = row.original.avatar_url
      const initials = [first_name?.[0], last_name?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase()
      
      return (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={initials || "Avatar"} />
            <AvatarFallback>
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            {(first_name || last_name) && (
              <div className="font-medium">
                {[first_name, last_name].filter(Boolean).join(" ")}
              </div>
            )}
            <div className={!first_name && !last_name ? "font-medium" : "text-sm text-muted-foreground"}>
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
      const role = row.getValue("role") as string
      const roleLabels: Record<string, string> = {
        admin: "Administrateur",
        manager: "Manager",
        agent: "Agent",
      }

      return (
        <Badge variant="outline">
          {roleLabels[role] || role}
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
      
      if (invited && !row.original.accepted_at) {
        label = "Invitation en attente"
      } else if (status === "inactive") {
        label = "Inactif"
      }

      return (
        <Badge variant="outline">
          {label}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, onSuccess }: { row: any; onSuccess?: () => void }) => {
      const member = row.original
      const [updateRoleOpen, setUpdateRoleOpen] = useState(false)
      
      const handleDelete = async () => {
        try {
          const response = await fetch(`/api/delete-member?user_id=${member.id}`, {
            method: "DELETE",
          })

          if (!response.ok) {
            throw new Error("Erreur lors de la suppression")
          }

          toast.success("Membre supprimé avec succès")
          onSuccess?.()
        } catch (error) {
          console.error("Error:", error)
          toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
        }
      }

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setUpdateRoleOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Modifier le rôle
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UpdateRoleDialog
            open={updateRoleOpen}
            onOpenChange={setUpdateRoleOpen}
            member={member}
            onSuccess={() => {
              onSuccess?.()
            }}
          />
        </div>
      )
    },
  },
] 