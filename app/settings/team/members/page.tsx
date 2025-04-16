"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  CardWithDividers,
  CardWithDividersHeader,
  CardWithDividersTitle,
  CardWithDividersDescription,
  CardWithDividersContent,
  CardWithDividersFooter,
} from "@/components/ui/card-with-dividers"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function TeamMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/get-client-members`)
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
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

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
    <CardWithDividers>
      <CardWithDividersHeader>
        <CardWithDividersTitle>
          Membres de l'équipe
        </CardWithDividersTitle>
        <CardWithDividersDescription>
          Gérez les membres de votre équipe. Les nouveaux membres recevront une invitation par email.
        </CardWithDividersDescription>
      </CardWithDividersHeader>
      <Separator />
      <CardWithDividersContent>
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Ajouter un membre</h3>
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
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Inviter
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Membres</h3>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="flex items-center justify-center h-[100px] text-muted-foreground border rounded-lg">
                <p>Aucun membre dans l'équipe</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
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
              </ScrollArea>
            )}
          </div>
        </div>
      </CardWithDividersContent>
    </CardWithDividers>
  )
} 