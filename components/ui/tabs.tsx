"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-4 border-b w-full relative",
      className
    )}
    {...props}
  >
    {props.children}
    <div className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 ease-out" />
  </TabsPrimitive.List>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-state' && trigger.dataset.state === 'active') {
          const list = trigger.parentElement
          const indicator = list?.querySelector('div:last-child') as HTMLElement
          if (indicator) {
            indicator.style.width = `${trigger.offsetWidth}px`
            indicator.style.transform = `translateX(${trigger.offsetLeft}px)`
          }
        }
      })
    })

    observer.observe(trigger, { attributes: true })

    const updatePosition = () => {
      if (trigger.dataset.state === 'active') {
        const list = trigger.parentElement
        const indicator = list?.querySelector('div:last-child') as HTMLElement
        if (indicator) {
          indicator.style.width = `${trigger.offsetWidth}px`
          indicator.style.transform = `translateX(${trigger.offsetLeft}px)`
        }
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePosition)
    }
  }, [])

  return (
  <TabsPrimitive.Trigger
      ref={triggerRef}
    className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative -mb-px",
      className
    )}
    {...props}
  />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
