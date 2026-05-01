import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "primary" | "secondary";
}

const variantStyles = {
  default: "bg-[rgba(255,255,255,0.08)] text-text-secondary",
  success: "bg-[rgba(34,197,94,0.15)] text-success",
  warning: "bg-[rgba(245,158,11,0.15)] text-warning",
  error: "bg-[rgba(239,68,68,0.15)] text-error",
  primary: "bg-[rgba(201,162,39,0.15)] text-primary",
  secondary: "bg-[rgba(255,255,255,0.06)] text-text-secondary",
};

export function getStatusVariant(status: string): BadgeProps["variant"] {
  const map: Record<string, BadgeProps["variant"]> = {
    PENDING: "warning",
    CONFIRMED: "primary",
    IN_PROGRESS: "primary",
    COMPLETED: "success",
    CANCELLED: "error",
    NO_SHOW: "error",
    WAITING: "warning",
    IN_SERVICE: "primary",
    CALLED: "success",
    ACTIVE: "success",
    PENDING_PAYMENT: "warning",
    EXPIRED: "error",
  };
  return map[status] || "default";
}

export default function Badge({
  variant = "default",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
