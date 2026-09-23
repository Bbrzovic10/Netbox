import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  farbe: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Live-Ring (pulsierend) fuer "arbeitet gerade". */
  live?: boolean;
  title?: string;
}

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

/**
 * Rundes Avatar mit Initialen. Hintergrund = User-Farbe, Textfarbe passt sich
 * ueber eine leichte Abdunklung an. Optional mit pulsierendem Live-Ring.
 */
export function Avatar({
  name,
  farbe,
  size = "md",
  className,
  live,
  title,
}: AvatarProps) {
  return (
    <div
      title={title ?? name}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-background select-none",
        SIZES[size],
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${farbe}, ${farbe}cc)`,
      }}
    >
      {initials(name)}
      {live && (
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-status-done live-dot ring-2 ring-background" />
      )}
    </div>
  );
}
