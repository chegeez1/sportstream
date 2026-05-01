import { useConfig } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Copy, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Config() {
  const { data, isLoading, isError } = useConfig();

  const wsExample = `// Connect to all sports
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Live update:', message);
};

// Or subscribe to specific league
ws.send(JSON.stringify({ 
  type: 'subscribe', 
  sport: 'soccer',
  league: 'eng.1' 
}));`;

  const restExample = `// Get current scoreboard
const response = await fetch('/api/sports/soccer/scoreboard');
const data = await response.json();

console.log(\`\${data.matchCount} active matches\`);
data.matches.forEach(match => {
  console.log(\`\${match.homeTeam.name} vs \${match.awayTeam.name}\`);
});`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Configuration</h2>
        <p className="text-sm text-muted-foreground">Supported sports, leagues, and integration examples.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError || !data ? (
        <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 rounded-xl border border-destructive/20 bg-destructive/10">
          <Zap className="h-10 w-10 text-destructive" />
          <h3 className="text-xl font-bold text-destructive">Config Registry Unavailable</h3>
          <p className="text-muted-foreground text-sm">Could not fetch supported sports configuration.</p>
        </div>
      ) : (
        <>
          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Supported Feeds</CardTitle>
              <CardDescription>
                Currently polling at <span className="font-bold text-primary">{data.pollIntervalSeconds}s</span> intervals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {data.sports.map((sport) => (
                  <div key={sport.sport} className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/10">
                    <h4 className="font-semibold text-lg capitalize flex items-center gap-2">
                      {sport.label}
                      <Badge variant="outline" className="text-xs font-mono">{sport.sport}</Badge>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sport.leagues.map((league) => (
                        <div key={league.id} className="flex flex-col border border-border/50 rounded bg-card px-3 py-2 text-sm" data-testid={`league-${league.id}`}>
                          <span className="font-medium">{league.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{league.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    WebSocket Integration
                  </CardTitle>
                  <CardDescription>Real-time push events</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(wsExample)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 border border-border/50 rounded-md p-4 overflow-x-auto">
                  <pre className="text-sm font-mono text-muted-foreground">
                    <code>{wsExample}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-blue-500" />
                    REST Integration
                  </CardTitle>
                  <CardDescription>Pull-based snapshot data</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(restExample)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 border border-border/50 rounded-md p-4 overflow-x-auto">
                  <pre className="text-sm font-mono text-muted-foreground">
                    <code>{restExample}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
