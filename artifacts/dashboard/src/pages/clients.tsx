import { useClients } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Clients() {
  const { data, isLoading, isError } = useClients();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Connected Clients</h2>
        <p className="text-sm text-muted-foreground">Active WebSocket connections.</p>
      </div>

      {isLoading ? (
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 rounded-xl border border-destructive/20 bg-destructive/10">
          <Zap className="h-10 w-10 text-destructive" />
          <h3 className="text-xl font-bold text-destructive">Client Registry Unavailable</h3>
          <p className="text-muted-foreground text-sm">Could not fetch active WebSocket connections.</p>
        </div>
      ) : (
        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Active Sessions</CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20" data-testid="total-clients-count">
              <Users className="w-3 h-3 mr-1" />
              {data.count} Connected
            </Badge>
          </CardHeader>
          <CardContent>
            {data.clients.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No active WebSocket clients connected.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Client ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Sport</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">League</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Connected At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clients.map((client) => (
                    <TableRow key={client.id} className="border-border/50" data-testid={`client-row-${client.id}`}>
                      <TableCell className="font-mono text-sm text-foreground">
                        {client.id}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {client.sport || "All"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {client.league ? (
                          <Badge variant="secondary">{client.league}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">All Leagues</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground" data-testid={`connected-at-${client.id}`}>
                        {new Date(client.connectedAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
