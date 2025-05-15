"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BadgePerso } from "@/components/ui/BadgePerso"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserCog, Trash2, Circle, Clock, XCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { UpdateRoleDialog } from "@/components/members/update-role-dialog"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

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
  last_seen_at: string | null
  client_members?: {
    client_id: string
    clients: {
      name: string
    }
  }[]
}

const userStatusConfig = {
  "En ligne": {
    icon: CheckCircle2,
    iconClass: "text-green-500",
    border: "border border-green-200",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  "Absent": {
    icon: Clock,
    iconClass: "text-orange-500",
    border: "border border-orange-200",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  "Inactif": {
    icon: Circle,
    iconClass: "text-gray-400",
    border: "border border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
  "Invitation en attente": {
    icon: Clock,
    iconClass: "text-blue-500",
    border: "border border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
  }
}

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-foreground font-medium hover:text-foreground/80 px-0"
        >
          Email
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      )
    },
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
              <div className="font-medium text-foreground">
                {[first_name, last_name].filter(Boolean).join(" ")}
              </div>
            )}
            <div className={!first_name && !last_name ? "font-medium text-foreground" : "text-sm text-muted-foreground"}>
              {row.original.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    id: "team",
    header: () => <span className="text-foreground font-medium">Équipe</span>,
    cell: ({ row }) => {
      const clientMembers = row.original.client_members
      if (!clientMembers || clientMembers.length === 0) {
        return null
      }
      
      // Prendre le premier client (un utilisateur ne devrait être que dans une seule équipe)
      const clientId = clientMembers[0]?.client_id
      const clientName = clientMembers[0]?.clients?.name

      if (!clientId || !clientName) {
        return null
      }

      return (
        <Link 
          href={`/admin/clients/${clientId}`}
          className="text-foreground hover:underline"
        >
          {clientName}
        </Link>
      )
    },
  },
  {
    accessorKey: "role",
    header: () => <span className="text-foreground font-medium">Rôle</span>,
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const roleLabels: Record<string, string> = {
        admin: "Administrateur",
        manager: "Manager",
        agent: "Agent",
      }

      return (
        <span className="text-muted-foreground">
          {roleLabels[role] || role}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <span className="text-foreground font-medium">Statut</span>,
    cell: ({ row }) => {
      const status = row.original.status
      const invited = row.original.invited
      const lastSeenAt = row.original.last_seen_at
      
      if (invited && !row.original.accepted_at) {
        return (
          <span className="text-muted-foreground">
            Invitation en attente
          </span>
        )
      }

      if (lastSeenAt) {
        const lastSeen = new Date(lastSeenAt)
        const now = new Date()
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
        
        if (lastSeen > fiveMinutesAgo) {
          return (
            <BadgePerso withDot>
              <span className="text-muted-foreground">Actif</span>
            </BadgePerso>
          )
        }
      }

      return (
        <BadgePerso withDot dotClassName="bg-gray-300">
          <span className="text-muted-foreground">Inactif</span>
        </BadgePerso>
      )
    },
  },
  {
    accessorKey: "last_seen_at",
    header: () => <span className="text-foreground font-medium">Dernière activité</span>,
    cell: ({ row }) => {
      const lastSeenAt = row.getValue("last_seen_at") as string | null
      
      if (!lastSeenAt) {
        return <span className="text-muted-foreground">Jamais</span>
      }

      return (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true, locale: fr })}
        </span>
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
          const response = await fetch("/api/delete-member", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: member.id })
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
              <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setUpdateRoleOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Modifier le rôle
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive hover:text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4 text-destructive group-hover:text-destructive" />
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