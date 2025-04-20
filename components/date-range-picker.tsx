"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  date,
  onDateChange,
}: DateRangePickerProps) {
  const presets = [
    {
      label: "7 derniers jours",
      days: 7,
    },
    {
      label: "30 derniers jours",
      days: 30,
    },
    {
      label: "60 derniers jours",
      days: 60,
    },
    {
      label: "90 derniers jours",
      days: 90,
    },
    {
      label: "365 derniers jours",
      days: 365,
    },
  ]

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL yyyy", { locale: fr })} -{" "}
                  {format(date.to, "dd LLL yyyy", { locale: fr })}
                </>
              ) : (
                format(date.from, "dd LLL yyyy", { locale: fr })
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
              locale={fr}
            />
            <div className="border-l p-2 flex flex-col gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.days}
                  variant="ghost"
                  className="justify-start text-sm h-8"
                  onClick={() => {
                    const to = new Date()
                    const from = addDays(to, -preset.days)
                    onDateChange({ from, to })
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 