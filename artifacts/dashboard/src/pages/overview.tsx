import { useStats } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Users, Zap, CheckCircle2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Overview() {
  const { data, isLoading, isError } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 rounded-xl border border-destructive/20 bg-destructive/10">
        <Zap className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold text-destructive">Telemetry Offline</h2>
        <p className="text-muted-foreground text-sm">Failed to connect to API statistics endpoint.</p>
      </div>
    );
  }

  const { stats } = data;
  const sortedEndpoints = [...stats.endpoints].sort((a, b) => b.hits - a.hits);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-mono" data-testid="stats-total-requests">
              {stats.requests.total.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {(stats.requests.total / Math.max(1, stats.uptimeMs / 60000)).toFixed(2)} req/min
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-mono" data-testid="stats-success-rate">
              {stats.requests.successRate.toFixed(2)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.requests.errors.toLocaleString()} errors total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Active Sockets</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-mono" data-testid="stats-active-sockets">
              {stats.websocket.connectedClients.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Connected clients
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground font-mono" data-testid="stats-uptime">
              {stats.uptime}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Running continuously
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Endpoint Traffic</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Path</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Hits</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEndpoints.map((endpoint) => (
                  <TableRow key={endpoint.path} className="border-border/50">
                    <TableCell className="font-mono text-sm text-foreground">
                      {endpoint.path}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground" data-testid={`hits-${endpoint.path}`}>
                      {endpoint.hits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {endpoint.errors > 0 ? (
                        <Badge variant="destructive" className="font-mono">{endpoint.errors}</Badge>
                      ) : (
                        <span className="font-mono text-sm text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Upstream Polling Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Polls Completed</p>
                <p className="text-2xl font-bold font-mono" data-testid="stats-poll-count">{stats.polling.count.toLocaleString()}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-primary opacity-50" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Last Poll</span>
                <span className="font-mono text-sm" data-testid="stats-last-poll">
                  {stats.polling.lastPollAt ? new Date(stats.polling.lastPollAt).toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Next Poll</span>
                <span className="font-mono text-sm" data-testid="stats-next-poll">
                  {stats.polling.nextPollAt ? new Date(stats.polling.nextPollAt).toLocaleTimeString() : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Polling Errors</span>
                <span className={`font-mono text-sm ${stats.polling.errors > 0 ? 'text-destructive' : 'text-muted-foreground'}`} data-testid="stats-poll-errors">
                  {stats.polling.errors}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
