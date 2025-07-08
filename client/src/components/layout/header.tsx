import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Truck, Plus, LogOut } from "lucide-react";

interface HeaderProps {
  onNewDelivery: () => void;
}

export default function Header({ onNewDelivery }: HeaderProps) {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Truck className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Entrega Express</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={onNewDelivery}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrega
            </Button>
            
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl && (
                <img 
                  className="h-8 w-8 rounded-full object-cover" 
                  src={user.profileImageUrl}
                  alt="Profile"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user?.firstName || user?.email || "Usuário"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
