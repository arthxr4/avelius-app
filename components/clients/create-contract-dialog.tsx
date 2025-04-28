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
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"

interface CreateContractDialogProps {
  clientId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const formSchema = z.object({
  contractType: z.enum(["one-shot", "recurring"]),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }).optional(),
  startDate: z.date({
    required_error: "La date de début est requise",
  }).optional(),
  goal: z.string().min(1, "L'objectif est requis").refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "L'objectif doit être un nombre positif",
  }),
  recurrenceEvery: z.string().optional(),
  recurrenceUnit: z.enum(["day", "week", "month"]).optional(),
}).refine((data) => {
  if (data.contractType === "one-shot" && !data.dateRange?.from && !data.dateRange?.to) {
    return false
  }
  if (data.contractType === "recurring" && (!data.startDate || !data.recurrenceEvery || !data.recurrenceUnit)) {
    return false
  }
  return true
}, {
  message: "Veuillez remplir tous les champs requis",
  path: ["dateRange"],
})

export function CreateContractDialog({
  clientId,
  trigger,
  onSuccess,
}: CreateContractDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractType: "one-shot",
      recurrenceUnit: "month",
      recurrenceEvery: "1",
    },
  })

  const contractType = form.watch("contractType")

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      // Calculer la date de fin de la première période pour un contrat récurrent
      let periodEndDate: Date | null = null
      if (values.contractType === "recurring" && values.recurrenceEvery && values.recurrenceUnit && values.startDate) {
        periodEndDate = new Date(values.startDate)
        const amount = parseInt(values.recurrenceEvery)
        
        switch (values.recurrenceUnit) {
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

      const response = await fetch("/api/create-client-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          start_date: values.contractType === "one-shot" 
            ? format(values.dateRange!.from, "yyyy-MM-dd")
            : format(values.startDate!, "yyyy-MM-dd"),
          end_date: values.contractType === "one-shot" 
            ? format(values.dateRange!.to, "yyyy-MM-dd")
            : null,
          is_recurring: values.contractType === "recurring",
          recurrence_unit: values.contractType === "recurring" ? values.recurrenceUnit : null,
          recurrence_every: values.contractType === "recurring" ? parseInt(values.recurrenceEvery!) : null,
          default_goal: parseInt(values.goal),
          first_period_end: values.contractType === "recurring" ? format(periodEndDate!, "yyyy-MM-dd") : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la création du contrat")
      }

      toast.success(
        values.contractType === "one-shot"
          ? "Contrat one-shot créé avec succès"
          : "Contrat récurrent créé avec succès"
      )
      setOpen(false)
      form.reset()
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
        {trigger || <Button variant="outline">Créer un contrat client</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="flex flex-col p-6 pb-11 gap-6">
          <DialogHeader>
            <DialogTitle>Créer un contrat client</DialogTitle>
            <DialogDescription>
              Configurez le type de contrat, la période et les objectifs à atteindre.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Type de contrat</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="one-shot" id="one-shot" />
                          <FormLabel htmlFor="one-shot" className="font-normal">One-shot</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="recurring" id="recurring" />
                          <FormLabel htmlFor="recurring" className="font-normal">Récurrent</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {contractType === "recurring" ? (
                <>
                  <FormField
                    control={form.control}
                    name="recurrenceEvery"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Fréquence</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              className="w-20"
                            />
                          </FormControl>
                          <FormField
                            control={form.control}
                            name="recurrenceUnit"
                            render={({ field }) => (
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="day">Jours</SelectItem>
                                    <SelectItem value="week">Semaines</SelectItem>
                                    <SelectItem value="month">Mois</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP", { locale: fr }) : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Période du contrat</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value?.from ? (
                                field.value.to ? (
                                  <>
                                    {format(field.value.from, "dd LLL yyyy", { locale: fr })} -{" "}
                                    {format(field.value.to, "dd LLL yyyy", { locale: fr })}
                                  </>
                                ) : (
                                  format(field.value.from, "dd LLL yyyy", { locale: fr })
                                )
                              ) : (
                                <span>Sélectionner une période</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={field.value?.from}
                              selected={field.value}
                              onSelect={field.onChange}
                              numberOfMonths={2}
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Objectif par période</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Nombre de RDV"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="bg-muted border-t px-6 py-4 rounded-b-lg">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                form.reset()
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading || !form.formState.isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                "Créer le contrat"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 