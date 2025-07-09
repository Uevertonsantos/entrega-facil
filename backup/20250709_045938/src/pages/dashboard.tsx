import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import { 
  Package, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  MessageSquare,
  Route,
  Plus,
  MapPin
} from "lucide-react";
import KpiCard from "@/components/stats/kpi-card";
import NewDeliveryModal from "@/components/modals/new-delivery-modal";
import NewMerchantModal from "@/components/modals/new-merchant-modal";
import NewDelivererModal from "@/components/modals/new-deliverer-modal";
import type { DeliveryWithRelations, Deliverer } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false);
  const [isNewMerchantOpen, setIsNewMerchantOpen] = useState(false);
  const [isNewDelivererOpen, setIsNewDelivererOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentDeliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithRelations[]>({
    queryKey: ["/api/deliveries/recent"],
    retry: false,
  });

  const { data: activeDeliverers, isLoading: deliverersLoading } = useQuery<Deliverer[]>({
    queryKey: ["/api/deliverers/active"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    const handleUnauthorized = (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    };

    // This would be handled by react-query error boundaries in a real app
    // For now, we'll handle it in the component
  }, [toast]);

  const handleWhatsAppMessage = (phone: string, delivererName: string) => {
    const message = `Olá ${delivererName}, você tem novas entregas disponíveis. Acesse o sistema para mais detalhes.`;
    // In a real app, this would call the WhatsApp API
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-secondary";
      case "in_route":
        return "bg-warning";
      case "pending":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluída";
      case "in_route":
        return "Em Rota";
      case "pending":
        return "Pendente";
      default:
        return "Desconhecido";
    }
  };

  if (statsLoading) {
    return (
      <div className="space-y-6 mobile-container">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mobile-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2 mobile-full-width">
          <Button
            onClick={() => setIsNewMerchantOpen(true)}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50 touch-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Comerciante
          </Button>
          <Button
            onClick={() => setIsNewDelivererOpen(true)}
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-50 touch-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Entregador
          </Button>
          <Button
            onClick={() => setIsNewDeliveryOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white touch-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrega
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Entregas Hoje"
          value={stats?.todayDeliveries || 0}
          icon={Package}
          color="bg-blue-100 text-primary"
        />
        <KpiCard
          title="Concluídas"
          value={stats?.completed || 0}
          icon={CheckCircle}
          color="bg-green-100 text-secondary"
        />
        <KpiCard
          title="Pendentes"
          value={stats?.pending || 0}
          icon={Clock}
          color="bg-orange-100 text-accent"
        />
        <KpiCard
          title="Receita Hoje"
          value={`R$ ${Number(stats?.revenue || 0).toFixed(2).replace('.', ',')}`}
          icon={DollarSign}
          color="bg-green-100 text-secondary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mobile-grid">
        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeliveries?.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {delivery.merchant.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {delivery.deliveryAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className={`${getStatusColor(delivery.status)} text-white mr-2`}>
                        {getStatusLabel(delivery.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(delivery.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {(!recentDeliveries || recentDeliveries.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma entrega recente encontrada
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Integração com Google Maps</p>
                <p className="text-xs text-gray-500">Rotas em tempo real</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.pending || 0}
                </div>
                <div className="text-sm text-gray-600">Rotas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {stats?.activeDeliverers || 0}
                </div>
                <div className="text-sm text-gray-600">Entregadores Online</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliverers */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Entregadores Ativos</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewDelivererOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Entregador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {deliverersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDeliverers?.map((deliverer) => (
                <div key={deliverer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {deliverer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {deliverer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deliverer.phone}
                        </p>
                      </div>
                    </div>
                    <span className="w-3 h-3 bg-secondary rounded-full"></span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>{deliverer.currentDeliveries} entregas em andamento</p>
                    <p>R$ 0,00 hoje</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500"
                      onClick={() => handleWhatsAppMessage(deliverer.phone, deliverer.name)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90 text-white border-primary"
                    >
                      <Route className="h-3 w-3 mr-1" />
                      Rota
                    </Button>
                  </div>
                </div>
              ))}
              {(!activeDeliverers || activeDeliverers.length === 0) && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Nenhum entregador ativo encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewDeliveryModal
        isOpen={isNewDeliveryOpen}
        onClose={() => setIsNewDeliveryOpen(false)}
      />
      <NewMerchantModal
        isOpen={isNewMerchantOpen}
        onClose={() => setIsNewMerchantOpen(false)}
      />
      <NewDelivererModal
        isOpen={isNewDelivererOpen}
        onClose={() => setIsNewDelivererOpen(false)}
      />
    </div>
  );
}
