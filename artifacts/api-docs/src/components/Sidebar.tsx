import { cn } from "@/lib/utils";
import { NAV } from "@/lib/content";
import { Activity } from "lucide-react";

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ activeId, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 overflow-y-auto bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-black text-foreground text-sm tracking-tight">
            Sport<span className="text-primary">Stream</span>
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold bg-primary/15 text-primary border border-primary/25 rounded px-1.5 py-0.5">
            API v1
          </span>
          <span className="text-[10px] text-muted-foreground">Documentation</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {NAV.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1.5">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded text-[0.8rem] transition-all",
                      activeId === item.id
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
        <p className="text-[10px] text-muted-foreground">
          Data from ESPN. Updates every 30s.
        </p>
      </div>
    </aside>
  );
}
