"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DeleteAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  appointmentId?: string
  appointmentDate?: string
  appointmentCount?: number
  onConfirm: () => void
}

export function DeleteAppointmentDialog({
  isOpen,
  onClose,
  appointmentId,
  appointmentDate,
  appointmentCount,
  onConfirm,
}: DeleteAppointmentDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const isBulkDelete = typeof appointmentCount === 'number'

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="[&>button]:hidden">
        <DialogHeader>
          <DialogTitle>
            {isBulkDelete ? "Supprimer les rendez-vous" : "Supprimer le rendez-vous"}
          </DialogTitle>
          <DialogDescription>
            {isBulkDelete ? (
              `Êtes-vous sûr de vouloir supprimer ${appointmentCount} rendez-vous ? Cette action ne peut pas être annulée.`
            ) : (
              `Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action ne peut pas être annulée.`
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              isBulkDelete ? `Supprimer ${appointmentCount} rendez-vous` : "Oui, supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 