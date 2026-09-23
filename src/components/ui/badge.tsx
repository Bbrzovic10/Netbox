import * as React from "react";
import { cn } from "@/lib/utils";

/** Kleines Status-Label mit Rand. Farben werden per className uebergeben. */
function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
