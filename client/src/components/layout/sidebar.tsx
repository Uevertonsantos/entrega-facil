import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  BarChart3, 
  Route, 
  Store, 
  Users, 
  FileText, 
  CreditCard,
  Settings,
  Smartphone,
  ShoppingBag,
  Package,
  Monitor,
  Wifi,
  TrendingUp,
  Key,
  Mail,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Entregas", href: "/deliveries", icon: Route },
  { name: "Comerciantes", href: "/merchants", icon: Store },
  { name: "Entregadores", href: "/deliverers", icon: Users },
  { name: "Relatórios", href: "/reports", icon: FileText },
  { name: "Financeiro", href: "/financial-dashboard", icon: CreditCard },
  { name: "Planos", href: "/plans", icon: Package },
  { name: "Clientes", href: "/clients", icon: Monitor },
  { name: "Monitor Clientes", href: "/clients-monitoring", icon: Wifi },
  { name: "Configurar Cliente", href: "/client-setup", icon: Settings },
  { name: "Monitor Tempo Real", href: "/monitor", icon: Wifi },
  { name: "App Entregador", href: "/deliverer-app", icon: Smartphone },
  { name: "App Comerciante", href: "/merchant-app", icon: ShoppingBag },
  { name: "Credenciais", href: "/test-credentials", icon: Key },
  { name: "Teste de Routing", href: "/routing-test", icon: Route },
  { name: "Configurações", href: "/settings", icon: Settings },
  { name: "Email", href: "/email-settings", icon: Mail },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarContent = (
    <nav className="mt-5 px-2 mobile-scroll-smooth">
      <div className="space-y-1 pb-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md touch-button mobile-tap-highlight",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </a>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden touch-button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:left-0 md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:bg-white md:shadow-sm md:border-r md:block pwa-safe-area md:overflow-hidden">
        <div className="h-full overflow-y-auto admin-sidebar-scroll">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg pwa-safe-area mobile-nav-height overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-purple-600">
                Entrega Fácil
              </h2>
            </div>
            <div className="h-[calc(100%-theme(spacing.16))] overflow-y-auto admin-sidebar-scroll">
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
