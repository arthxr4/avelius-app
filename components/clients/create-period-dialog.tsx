"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DateRange } from "react-day-picker"

interface CreatePeriodDialogProps {
  clientId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CreatePeriodDialog({ clientId, trigger, onSuccess }: CreatePeriodDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [goal, setGoal] = useState<number>(0)

  const handleSubmit = async () => {
    if (!dateRange?.from || !dateRange?.to || !goal || goal < 1) {
      toast.error("Veuillez remplir tous les champs correctement")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/contract/period/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          startDate: dateRange.from.toISOString().split('T')[0],
          endDate: dateRange.to.toISOString().split('T')[0],
          goal,
        }),
      })

      if (!response.ok) throw new Error("Failed to create period")

      toast.success("Période créée avec succès")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating period:", error)
      toast.error("Erreur lors de la création de la période")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Créer une période</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle période</DialogTitle>
          <DialogDescription>
            Définissez les dates et l'objectif de la nouvelle période.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Période</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP", { locale: fr })} -{" "}
                        {format(dateRange.to, "PPP", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "PPP", { locale: fr })
                    )
                  ) : (
                    "Sélectionner une période"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal">Objectif de RDV</Label>
            <Input
              id="goal"
              type="number"
              min={1}
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !dateRange?.from || !dateRange?.to || !goal || goal < 1}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 