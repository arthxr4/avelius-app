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
  const isBulkDelete = typeof appointmentCount === 'number'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isBulkDelete ? "Supprimer les rendez-vous" : "Supprimer le rendez-vous"}
          </DialogTitle>
          <DialogDescription>
            {isBulkDelete ? (
              `Êtes-vous sûr de vouloir supprimer ${appointmentCount} rendez-vous ? Cette action ne peut pas être annulée.`
            ) : (
              `Êtes-vous sûr de vouloir supprimer ce rendez-vous du ${appointmentDate} ? Cette action ne peut pas être annulée.`
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {isBulkDelete ? `Supprimer ${appointmentCount} rendez-vous` : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 