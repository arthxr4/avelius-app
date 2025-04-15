import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface UpdateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    id: string
    email: string
    role: string
  }
  onSuccess?: () => void
}

export function UpdateRoleDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: UpdateRoleDialogProps) {
  const [role, setRole] = useState(member.role)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/update-member", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: member.id,
          role,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du rôle")
      }

      toast.success("Rôle modifié avec succès")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification du rôle")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le rôle</DialogTitle>
          <DialogDescription>
            Modifier le rôle de {member.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Modification..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 