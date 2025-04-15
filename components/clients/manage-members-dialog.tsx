"use client"

import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Trash2, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Member {
  id: string
  user_email: string
  invited: boolean
  accepted_at: string | null
  users: {
    first_name: string | null
    last_name: string | null
    email: string
    status: string
  }
}

interface ManageMembersDialogProps {
  clientId: string
  clientName: string
  trigger?: React.ReactNode
}

export function ManageMembersDialog({
  clientId,
  clientName,
  trigger,
}: ManageMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/get-client-members?clientId=${clientId}`)
      const data = await response.json()
      
      if (response.ok) {
        setMembers(data)
      } else {
        toast.error("Erreur lors de la récupération des membres")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la récupération des membres")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/add-client-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          email: newMemberEmail.trim(),
        }),
      })

      if (response.ok) {
        toast.success("Invitation envoyée avec succès")
        setNewMemberEmail("")
        await fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de l'ajout du membre")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'ajout du membre")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/remove-client-member?id=${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Membre supprimé avec succès")
        await fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la suppression du membre")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression du membre")
    }
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "?"
    return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}`
  }

  const getMemberStatus = (member: Member) => {
    if (member.users.status === "active") return "Actif"
    if (member.users.status === "invited") return "En attente"
    return member.users.status
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) {
        setLoading(true)
        fetchMembers()
      }
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gérer les membres - {clientName}</DialogTitle>
          <DialogDescription>
            Ajoutez ou supprimez des membres pour ce client. Les nouveaux membres recevront une invitation par email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ajouter un membre</h3>
            <form onSubmit={handleAddMember} className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Email du nouveau membre"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter
              </Button>
            </form>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Membres</h3>
            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Chargement...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Aucun membre pour ce client</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(member.users.first_name, member.users.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {member.users.first_name && member.users.last_name
                              ? `${member.users.first_name} ${member.users.last_name}`
                              : member.users.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.users.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.users.status === "active" ? "default" : "secondary"}>
                          {getMemberStatus(member)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 