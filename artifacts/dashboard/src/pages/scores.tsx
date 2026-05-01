import { useState } from "react";
import { useScores } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function Scores() {
  const [sport, setSport] = useState<"soccer" | "basketball">("soccer");
  const { data, isLoading, isError } = useScores(sport);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Scores</h2>
          <p className="text-sm text-muted-foreground">Real-time match data telemetry.</p>
        </div>
        
        <Tabs value={sport} onValueChange={(v) => setSport(v as "soccer" | "basketball")} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="soccer" data-testid="tab-soccer">Soccer</TabsTrigger>
            <TabsTrigger value="basketball" data-testid="tab-basketball">Basketball</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 rounded-xl border border-destructive/20 bg-destructive/10">
          <Zap className="h-10 w-10 text-destructive" />
          <h3 className="text-xl font-bold text-destructive">Data Feed Interrupted</h3>
          <p className="text-muted-foreground text-sm">Could not retrieve live scores from upstream.</p>
        </div>
      ) : data.matches.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center space-y-4 rounded-xl border border-border/50 bg-card">
          <h3 className="text-xl font-bold text-muted-foreground">No Live Matches</h3>
          <p className="text-muted-foreground text-sm">There are no active matches for this sport right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.matches.map((match) => (
            <Card key={match.id} className="border-border/50 shadow-md overflow-hidden bg-card" data-testid={`match-card-${match.id}`}>
              <div className="flex items-center justify-between bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <span>{match.leagueName}</span>
                {match.status === "in" ? (
                  <Badge variant="default" className="bg-green-500/20 text-green-400 hover:bg-green-500/20 border-green-500/30 animate-pulse">
                    LIVE
                  </Badge>
                ) : match.status === "post" ? (
                  <Badge variant="secondary">FINAL</Badge>
                ) : (
                  <Badge variant="outline">UPCOMING</Badge>
                )}
              </div>
              <CardContent className="p-5">
                <div className="text-center mb-4 text-xs font-mono font-medium text-muted-foreground tracking-wider">
                  {match.statusDetail || match.clock || "Scheduled"}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-2/3">
                      {match.homeTeam.logo ? (
                        <img src={match.homeTeam.logo} alt={match.homeTeam.abbreviation} className="w-8 h-8 object-contain bg-white rounded-full p-1" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{match.homeTeam.abbreviation}</div>
                      )}
                      <span className="font-semibold truncate text-foreground" title={match.homeTeam.name}>{match.homeTeam.name}</span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-foreground" data-testid={`score-home-${match.id}`}>{match.homeTeam.score || "0"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-2/3">
                      {match.awayTeam.logo ? (
                        <img src={match.awayTeam.logo} alt={match.awayTeam.abbreviation} className="w-8 h-8 object-contain bg-white rounded-full p-1" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{match.awayTeam.abbreviation}</div>
                      )}
                      <span className="font-semibold truncate text-foreground" title={match.awayTeam.name}>{match.awayTeam.name}</span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-foreground" data-testid={`score-away-${match.id}`}>{match.awayTeam.score || "0"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
