import { useLocation } from "wouter";
import { Link } from "wouter";
import { Activity, LayoutDashboard, Users, Settings, Trophy, Radio } from "lucide-react";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader
} from "@/components/ui/sidebar";
import { useStats } from "@/hooks/use-api";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data, isError } = useStats();

  const navItems = [
    { title: "Overview", icon: LayoutDashboard, href: "/" },
    { title: "Live Scores", icon: Trophy, href: "/scores" },
    { title: "Connected Clients", icon: Users, href: "/clients" },
    { title: "Configuration", icon: Settings, href: "/config" },
  ];

  const isHealthy = !isError && data;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background dark">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Activity className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none tracking-tight text-foreground">SportStream</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Mission Control</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">Monitoring</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href} className="flex items-center gap-3" data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">API Telemetry</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 py-1 shadow-sm">
                <span className="relative flex h-2 w-2">
                  {isHealthy && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider" data-testid="status-indicator">
                  {isHealthy ? 'System Operational' : 'Degraded'}
                </span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
