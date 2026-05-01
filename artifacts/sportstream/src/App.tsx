import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import FootballPage from "@/pages/football";
import BasketballPage from "@/pages/basketball";
import MatchDetailPage from "@/pages/match-detail";
import { Navbar } from "@/components/Navbar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 25000,
      retry: 2,
    },
  },
});

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/football" component={FootballPage} />
        <Route path="/basketball" component={BasketballPage} />
        <Route path="/match/:id" component={MatchDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
