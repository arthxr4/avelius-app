"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
}

export function DateTimePicker({ date, onSelect }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Générer les créneaux de 15 minutes
  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({
          hour,
          minute,
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
    return slots;
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Garder l'heure actuelle si elle existe
      if (date) {
        selectedDate.setHours(date.getHours(), date.getMinutes());
      }
      onSelect?.(selectedDate);
    }
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(hour, minute);
      onSelect?.(newDate);
    } else {
      const newDate = new Date();
      newDate.setHours(hour, minute);
      onSelect?.(newDate);
    }
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      modal={true}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "d MMMM yyyy HH:mm", { locale: fr })
          ) : (
            <span>Sélectionner une date et heure</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={fr}
          />
          <div className="border-l">
            <ScrollArea className="h-[300px]">
              <div className="p-2 w-[120px]">
                {timeSlots.map(({ hour, minute, label }) => (
                  <Button
                    key={label}
                    variant={date && date.getHours() === hour && date.getMinutes() === minute ? "default" : "ghost"}
                    className="w-full justify-center font-normal mb-1"
                    onClick={() => handleTimeSelect(hour, minute)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
