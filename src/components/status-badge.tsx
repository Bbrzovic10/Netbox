import type { CustomerStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_CLASS, STATUS_SHORT } from "@/lib/status";
import { cn } from "@/lib/utils";

/** Kurzes farbiges Status-Badge (grau / orange / grün). */
export function StatusBadge({
  status,
  className,
}: {
  status: CustomerStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(STATUS_BADGE_CLASS[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_SHORT[status]}
    </Badge>
  );
}
