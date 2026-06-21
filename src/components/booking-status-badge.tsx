import { Badge } from "@/components/ui/badge";

type StatusConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_CONFIRMATION: { label: "Очікує підтвердження", variant: "outline", className: "border-accent/40 text-accent" },
  PENDING_PAYMENT: { label: "Очікує оплати", variant: "outline", className: "border-accent/40 text-accent" },
  CONFIRMED: { label: "Підтверджено", variant: "default" },
  COMPLETED: { label: "Завершено", variant: "secondary" },
  CANCELLED: { label: "Скасовано", variant: "destructive" },
  NO_SHOW: { label: "Не з’явились", variant: "destructive" },
  EXPIRED: { label: "Протерміновано", variant: "secondary" },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
