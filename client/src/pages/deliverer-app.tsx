import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Clock, DollarSign, Package, CheckCircle, XCircle, User, Phone, LogOut, Settings } from "lucide-react";
import type { DeliveryWithRelations, Deliverer } from "@shared/schema";

export default function DelivererApp() {
  const [isOnline, setIsOnline] = useState(false);
  const queryClient = useQueryClient();
  
  const handleLogout = () => {
    // Clear all tokens from localStorage
    localStorage.removeItem("adminToken");
    localStorage.removeItem("merchantToken");
    localStorage.removeItem("delivererToken");
    
    // Redirect to landing page
    window.location.href = "/";
  };
  
  const handleSwitchUser = () => {
    // Clear all tokens from localStorage
    localStorage.removeItem("adminToken");
    localStorage.removeItem("merchantToken");
    localStorage.removeItem("delivererToken");
    
    // Redirect to landing page
    window.location.href = "/";
  };

  const { data: delivererResponse, isLoading: delivererLoading } = useQuery({
    queryKey: ['/api/deliverers/current'],
    retry: false,
  });

  const deliverer = delivererResponse?.isDeliverer ? delivererResponse : null;

  const { data: availableDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/available'],
    enabled: isOnline,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const { data: myDeliveries = [], isLoading: myDeliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/my-deliveries'],
    enabled: !!deliverer,
  });

  const toggleOnlineMutation = useMutation({
    mutationFn: async (online: boolean) => {
      if (!deliverer) return;
      await apiRequest("PATCH", `/api/deliverers/${deliverer.id}`, {
        isOnline: online
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliverers/current'] });
      toast({
        title: isOnline ? "Você está online!" : "Você está offline",
        description: isOnline ? "Você receberá novas solicitações de entrega" : "Você não receberá novas solicitações",
      });
    },
  });

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      await apiRequest("POST", `/api/deliveries/${deliveryId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-deliveries'] });
      toast({
        title: "Entrega aceita!",
        description: "A entrega foi atribuída a você. Vá até o local de coleta.",
      });
    },
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/deliveries/${id}`, {
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-deliveries'] });
      toast({
        title: "Status atualizado!",
        description: "O status da entrega foi atualizado com sucesso.",
      });
    },
  });

  const handleToggleOnline = (checked: boolean) => {
    setIsOnline(checked);
    toggleOnlineMutation.mutate(checked);
  };

  const handleAcceptDelivery = (deliveryId: number) => {
    acceptDeliveryMutation.mutate(deliveryId);
  };

  const handleUpdateStatus = (deliveryId: number, status: string) => {
    updateDeliveryStatusMutation.mutate({ id: deliveryId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'in_transit': return 'Em trânsito';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (delivererLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!deliverer) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-blue-600">Área do Entregador</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Você não está registrado como entregador.</p>
            <p className="text-sm text-gray-500 mb-6">Entre em contato com o administrador para ser cadastrado e começar a receber entregas na sua região.</p>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleSwitchUser}
                className="w-full flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Trocar Tipo de Usuário
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Olá, {deliverer.name}!</CardTitle>
                  <p className="text-gray-600">Painel do Entregador</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSwitchUser}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Trocar Usuário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Status:</span>
                    <Switch
                      checked={isOnline}
                      onCheckedChange={handleToggleOnline}
                      disabled={toggleOnlineMutation.isPending}
                    />
                    <Badge variant={isOnline ? "default" : "secondary"}>
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Entregas Disponíveis */}
        {isOnline && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Entregas Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deliveriesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Buscando entregas...</p>
                  </div>
                ) : availableDeliveries.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma entrega disponível no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableDeliveries.map((delivery: DeliveryWithRelations) => (
                      <Card key={delivery.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="font-semibold text-lg">{delivery.merchant.name}</h3>
                                <Badge className="bg-green-100 text-green-800">
                                  R$ {Number(delivery.price).toFixed(2).replace('.', ',')}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>De: {delivery.pickupAddress}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>Para: {delivery.deliveryAddress}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>Cliente: {delivery.customerName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>Telefone: {delivery.customerPhone}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAcceptDelivery(delivery.id)}
                              disabled={acceptDeliveryMutation.isPending}
                              className="ml-4"
                            >
                              Aceitar Entrega
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Minhas Entregas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Minhas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myDeliveriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando suas entregas...</p>
              </div>
            ) : myDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Você ainda não possui entregas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myDeliveries.map((delivery: DeliveryWithRelations) => (
                  <Card key={delivery.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold text-lg">{delivery.merchant.name}</h3>
                            <Badge className={getStatusColor(delivery.status)}>
                              {getStatusText(delivery.status)}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">
                              R$ {Number(delivery.price).toFixed(2).replace('.', ',')}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>De: {delivery.pickupAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>Para: {delivery.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Cliente: {delivery.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>Telefone: {delivery.customerPhone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {delivery.status === 'accepted' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(delivery.id, 'in_transit')}
                              disabled={updateDeliveryStatusMutation.isPending}
                            >
                              Iniciar Entrega
                            </Button>
                          )}
                          {delivery.status === 'in_transit' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(delivery.id, 'delivered')}
                              disabled={updateDeliveryStatusMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Marcar como Entregue
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}