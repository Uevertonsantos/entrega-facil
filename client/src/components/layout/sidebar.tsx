import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
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
  Wifi
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Entregas", href: "/deliveries", icon: Route },
  { name: "Comerciantes", href: "/merchants", icon: Store },
  { name: "Entregadores", href: "/deliverers", icon: Users },
  { name: "Relatórios", href: "/reports", icon: FileText },
  { name: "Financeiro", href: "/financial", icon: CreditCard },
  { name: "Planos", href: "/plans", icon: Package },
  { name: "Clientes", href: "/clients", icon: Monitor },
  { name: "Monitor Tempo Real", href: "/monitor", icon: Wifi },
  { name: "App Entregador", href: "/deliverer-app", icon: Smartphone },
  { name: "App Comerciante", href: "/merchant-app", icon: ShoppingBag },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-sm border-r">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
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
    </aside>
  );
}
