import { Badge } from "@/components/ui/badge";

type StatusConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_CONFIRMATION: { label: "Очікує підтвердження", variant: "outline", className: "border-studio-warning/40 text-studio-warning" },
  PENDING_PAYMENT: { label: "Очікує оплати", variant: "outline", className: "border-studio-warning/40 text-studio-warning" },
  CONFIRMED: { label: "Підтверджено", variant: "outline", className: "border-studio-success/40 bg-studio-success/10 text-studio-success" },
  COMPLETED: { label: "Завершено", variant: "outline", className: "border-studio-accent/30 bg-studio-accent-soft text-studio-accent" },
  CANCELLED: { label: "Скасовано", variant: "outline", className: "border-studio-danger/40 bg-studio-danger/10 text-studio-danger" },
  NO_SHOW: { label: "Не з’явились", variant: "outline", className: "border-studio-danger/40 bg-studio-danger/10 text-studio-danger" },
  EXPIRED: { label: "Протерміновано", variant: "outline", className: "border-studio-border bg-studio-surface-raised text-studio-muted" },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
