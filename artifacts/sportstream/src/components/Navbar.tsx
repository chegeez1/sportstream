import { Link, useLocation } from "wouter";
import { Activity, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const [tick, setTick] = useState(formatTime(lastUpdated));
  useEffect(() => {
    const interval = setInterval(() => setTick(formatTime(new Date())), 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: "/", label: "All Sports" },
    { href: "/football", label: "Football" },
    { href: "/basketball", label: "Basketball" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <Activity className="h-6 w-6 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                </div>
                <span className="text-xl font-black tracking-tight text-foreground">
                  Sport<span className="text-primary">Stream</span>
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <button
                    data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-semibold transition-all",
                      location === link.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {link.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline">Live</span>
            <span className="font-mono">{tick}</span>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <button
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  location === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {link.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
