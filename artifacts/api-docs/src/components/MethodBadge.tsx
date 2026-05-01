import { cn } from "@/lib/utils";

interface MethodBadgeProps {
  method: "GET" | "POST" | "WS";
  className?: string;
}

const styles: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  WS: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
};

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-black tracking-widest px-2 py-0.5 rounded font-mono",
        styles[method],
        className
      )}
    >
      {method}
    </span>
  );
}
