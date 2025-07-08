import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Deliveries from "@/pages/deliveries";
import Merchants from "@/pages/merchants";
import Deliverers from "@/pages/deliverers";
import Reports from "@/pages/reports";
import Financial from "@/pages/financial";
import DelivererApp from "@/pages/deliverer-app";
import MerchantApp from "@/pages/merchant-app";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/deliveries" component={Deliveries} />
        <Route path="/merchants" component={Merchants} />
        <Route path="/deliverers" component={Deliverers} />
        <Route path="/reports" component={Reports} />
        <Route path="/financial" component={Financial} />
        <Route path="/deliverer-app" component={DelivererApp} />
        <Route path="/merchant-app" component={MerchantApp} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
