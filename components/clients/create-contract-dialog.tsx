"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

interface CreateContractDialogProps {
  clientId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CreateContractDialog({
  clientId,
  trigger,
  onSuccess,
}: CreateContractDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contractType, setContractType] = useState<"one-shot" | "recurring">("one-shot")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [goal, setGoal] = useState<string>("")
  const [recurrenceUnit, setRecurrenceUnit] = useState<"day" | "week" | "month">("month")
  const [recurrenceEvery, setRecurrenceEvery] = useState<string>("1")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || (!endDate && contractType === "one-shot") || !goal) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    if (contractType === "recurring" && (!recurrenceEvery || parseInt(recurrenceEvery) < 1)) {
      toast.error("Veuillez spécifier une fréquence valide")
      return
    }

    setLoading(true)
    try {
      // Calculer la date de fin de la première période pour un contrat récurrent
      let periodEndDate: Date | null = null
      if (contractType === "recurring") {
        periodEndDate = new Date(startDate)
        const amount = parseInt(recurrenceEvery)
        
        switch (recurrenceUnit) {
          case "day":
            periodEndDate.setDate(periodEndDate.getDate() + amount - 1)
            break
          case "week":
            periodEndDate.setDate(periodEndDate.getDate() + (amount * 7) - 1)
            break
          case "month":
            periodEndDate.setMonth(periodEndDate.getMonth() + amount)
            periodEndDate.setDate(periodEndDate.getDate() - 1)
            break
        }
      }

      // Créer le contrat (qui crée aussi automatiquement la première période)
      const contractResponse = await fetch("/api/create-client-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: contractType === "one-shot" ? format(endDate!, "yyyy-MM-dd") : null,
          is_recurring: contractType === "recurring",
          recurrence_unit: contractType === "recurring" ? recurrenceUnit : null,
          recurrence_every: contractType === "recurring" ? parseInt(recurrenceEvery) : null,
          default_goal: parseInt(goal),
          first_period_end: contractType === "recurring" ? format(periodEndDate!, "yyyy-MM-dd") : null,
        }),
      })

      if (!contractResponse.ok) {
        throw new Error("Erreur lors de la création du contrat")
      }

      toast.success(
        contractType === "one-shot"
          ? "Contrat one-shot créé avec succès"
          : "Contrat récurrent créé avec succès"
      )
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Définir les objectifs</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Définir les objectifs</DialogTitle>
          <DialogDescription>
            Créez un nouveau contrat et définissez les objectifs pour ce client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type de contrat</Label>
              <RadioGroup
                defaultValue="one-shot"
                onValueChange={(value) => setContractType(value as "one-shot" | "recurring")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-shot" id="one-shot" />
                  <Label htmlFor="one-shot">One-shot</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurring" id="recurring" />
                  <Label htmlFor="recurring">Récurrent</Label>
                </div>
              </RadioGroup>
            </div>

            {contractType === "recurring" && (
              <div className="grid gap-2">
                <Label>Fréquence</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={recurrenceEvery}
                    onChange={(e) => setRecurrenceEvery(e.target.value)}
                    className="w-20"
                  />
                  <select
                    value={recurrenceUnit}
                    onChange={(e) => setRecurrenceUnit(e.target.value as "day" | "week" | "month")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="day">Jours</option>
                    <option value="week">Semaines</option>
                    <option value="month">Mois</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {contractType === "one-shot" && (
              <div className="grid gap-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={fr}
                      disabled={(date) =>
                        date < (startDate || new Date()) ||
                        date < new Date()
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Objectif {contractType === "recurring" ? `par ${recurrenceUnit === 'day' ? 'jour' : recurrenceUnit === 'week' ? 'semaine' : 'mois'}` : ""} de RDV</Label>
              <Input
                type="number"
                min="1"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Nombre de RDV"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer le contrat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 