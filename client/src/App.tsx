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
import AdminLogin from "@/pages/admin-login";
import AdminSettings from "@/pages/admin-settings";
import MerchantLogin from "@/pages/merchant-login";
import DelivererLogin from "@/pages/deliverer-login";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";

function Router() {
  const { isAuthenticated, isLoading, isAdmin, isMerchant, isDeliverer } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/merchant-login" component={MerchantLogin} />
        <Route path="/deliverer-login" component={DelivererLogin} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Route based on user type
  if (isMerchant) {
    return <MerchantApp />;
  }
  
  if (isDeliverer) {
    return <DelivererApp />;
  }
  
  // If user is admin, show admin dashboard
  if (isAdmin) {
    return (
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/deliveries" component={Deliveries} />
          <Route path="/merchants" component={Merchants} />
          <Route path="/deliverers" component={Deliverers} />
          <Route path="/reports" component={Reports} />
          <Route path="/financial" component={Financial} />
          <Route path="/settings" component={AdminSettings} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }
  
  // Default to landing page if no specific user type
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/merchant-login" component={MerchantLogin} />
      <Route path="/deliverer-login" component={DelivererLogin} />
      <Route component={NotFound} />
    </Switch>
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
