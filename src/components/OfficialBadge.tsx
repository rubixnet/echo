import { Music } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfficialBadge({ isOfficial, className }: { isOfficial: boolean, className?: string }) {
    if (!isOfficial) return null

    return (
        <span
            className={cn("inline-flex items-center justify-center text-foreground/40", className)}
            title="Official Artist"
        >
            <Music size={12} strokeWidth={3} className="ml-1" />
        </span>
    );
}