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

interface DeleteAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  appointmentDate?: string
}

export function DeleteAppointmentDialog({
  isOpen,
  onClose,
  onConfirm,
  appointmentDate,
}: DeleteAppointmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le rendez-vous</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce rendez-vous
            {appointmentDate ? ` du ${appointmentDate}` : ""} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 