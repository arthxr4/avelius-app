import { LoaderCircle, Circle, Hexagon, CheckCircle, XCircle } from "lucide-react";
import clsx from "clsx";

interface BadgePersoProps {
  status: "Backlog" | "Planned" | "In Progress" | "Completed" | "Canceled";
  count?: number;
  selected?: boolean;
}

const statusConfig = {
  Backlog: {
    icon: LoaderCircle,
    iconClass: "text-orange-500",
    border: "border-dashed border-orange-300",
    bg: "bg-transparent",
    text: "text-gray-900",
  },
  Planned: {
    icon: Circle,
    iconClass: "text-gray-400",
    border: "border border-gray-300",
    bg: "bg-transparent",
    text: "text-gray-900",
  },
  "In Progress": {
    icon: Hexagon,
    iconClass: "text-yellow-500",
    border: "border border-yellow-200",
    bg: "bg-transparent",
    text: "text-gray-900",
  },
  Completed: {
    icon: CheckCircle,
    iconClass: "text-blue-600",
    border: "border border-blue-200",
    bg: "bg-transparent",
    text: "text-gray-900",
  },
  Canceled: {
    icon: XCircle,
    iconClass: "text-gray-400",
    border: "border border-gray-200",
    bg: "bg-transparent",
    text: "text-gray-400",
  },
};

export function BadgePerso({ status, count, selected }: BadgePersoProps) {
  const conf = statusConfig[status];
  const Icon = conf.icon;
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-sm font-normal min-w-0 w-fit",
        conf.bg,
        conf.border,
        conf.text,
        selected && "font-semibold"
      )}
    >
      <Icon className={clsx("w-4 h-4", conf.iconClass)} strokeWidth={status === "Backlog" ? 2 : 1.5} />
      <span>{status}</span>
      {typeof count === "number" && (
        <span className="ml-2 text-xs font-normal tabular-nums">{count}</span>
      )}
    </span>
  );
} 