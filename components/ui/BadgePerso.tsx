import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgePersoProps extends React.HTMLAttributes<HTMLSpanElement> {
  withDot?: boolean;
  dotClassName?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export function BadgePerso({
  children,
  withDot,
  dotClassName,
  icon: Icon,
  iconClassName,
  className,
  ...props
}: BadgePersoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      {withDot && (
        <span 
          className={cn(
            "h-2 w-2 rounded-full bg-emerald-400",
            dotClassName
          )} 
        />
      )}
      {Icon && (
        <Icon 
          className={cn(
            "h-3 w-3",
            iconClassName
          )} 
        />
      )}
      {children}
    </span>
  );
} 