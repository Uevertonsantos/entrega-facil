import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Clock, DollarSign, Package, CheckCircle, XCircle, User, Phone, LogOut, Settings, Volume2, BarChart3, TrendingUp, Calendar, Eye, FileText } from "lucide-react";
import type { DeliveryWithRelations, Deliverer } from "@shared/schema";
import DeliveryManagementModal from "@/components/modals/delivery-management-modal";
import CommissionReport from "@/components/deliverer/commission-report";

export default function DelivererApp() {
  const [isOnline, setIsOnline] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousDeliveryCount, setPreviousDeliveryCount] = useState(0);
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

  const { data: stats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/deliverers/stats'],
    enabled: !!deliverer,
    refetchInterval: 30000,
  });

  const toggleOnlineMutation = useMutation({
    mutationFn: async (online: boolean) => {
      if (!deliverer) return;
      await apiRequest(`/api/deliverers/${deliverer.id}`, "PATCH", {
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
      await apiRequest(`/api/deliveries/${deliveryId}/accept`, "POST");
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



  const handleToggleOnline = (checked: boolean) => {
    setIsOnline(checked);
    toggleOnlineMutation.mutate(checked);
  };

  const handleAcceptDelivery = (deliveryId: number) => {
    acceptDeliveryMutation.mutate(deliveryId);
  };



  // Create notification sound using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Erro ao reproduzir som:", error);
    }
  };

  // Effect to play sound when new deliveries are available
  useEffect(() => {
    if (availableDeliveries.length > previousDeliveryCount && previousDeliveryCount > 0) {
      playNotificationSound();
      toast({
        title: "Nova entrega disponível!",
        description: "Uma nova entrega está aguardando para ser aceita.",
        duration: 5000,
      });
    }
    setPreviousDeliveryCount(availableDeliveries.length);
  }, [availableDeliveries.length, previousDeliveryCount]);

  useEffect(() => {
    if (deliverer && deliverer.isOnline) {
      setIsOnline(true);
    }
  }, [deliverer]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluída';
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
      <div className="max-w-6xl mx-auto">
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
                    <Volume2 className="h-4 w-4 text-gray-500" />
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                    />
                    <span className="text-sm text-gray-600">Som</span>
                  </div>
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
                    <Switch
                      checked={isOnline}
                      onCheckedChange={handleToggleOnline}
                      disabled={toggleOnlineMutation.isPending}
                    />
                    <span className="text-sm font-medium">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deliveries" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="commission">Comissões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deliveries" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Entregas Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Entregas Disponíveis</CardTitle>
                  <p className="text-sm text-gray-600">
                    {availableDeliveries.length} entrega(s) aguardando
                  </p>
                </CardHeader>
                <CardContent>
                  {isOnline ? (
                    <div className="space-y-4">
                      {availableDeliveries.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          Nenhuma entrega disponível no momento
                        </p>
                      ) : (
                        availableDeliveries.map((delivery: DeliveryWithRelations) => (
                          <div key={delivery.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{delivery.merchant.name}</h3>
                                <p className="text-sm text-gray-600">{delivery.merchant.address}</p>
                              </div>
                              <Badge variant="secondary">
                                R$ {(Number(delivery.price) || Number(delivery.estimatedValue) || 0).toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{delivery.description}</p>
                            <div className="mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">Cliente:</span>
                                {delivery.customerName}
                                {delivery.customerPhone && (
                                  <span className="text-gray-500">• {delivery.customerPhone}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4" />
                                {delivery.deliveryAddress}
                              </div>
                              {delivery.paymentMethod && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-medium">Pagamento:</span>
                                  {delivery.paymentMethod === 'dinheiro' ? 'Dinheiro' : 
                                   delivery.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                                   delivery.paymentMethod === 'cartao_debito' ? 'Cartão de Débito' :
                                   delivery.paymentMethod === 'pix' ? 'PIX' :
                                   delivery.paymentMethod === 'cartao_refeicao' ? 'Cartão Refeição' :
                                   delivery.paymentMethod === 'vale_alimentacao' ? 'Vale Alimentação' :
                                   delivery.paymentMethod}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptDelivery(delivery.id)}
                                disabled={acceptDeliveryMutation.isPending}
                              >
                                Aceitar
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <Package className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-600">
                        Coloque-se online para ver entregas disponíveis
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Minhas Entregas */}
              <Card>
                <CardHeader>
                  <CardTitle>Minhas Entregas</CardTitle>
                  <p className="text-sm text-gray-600">
                    {myDeliveries.length} entrega(s) ativa(s)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myDeliveries.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        Nenhuma entrega ativa
                      </p>
                    ) : (
                      myDeliveries.map((delivery: DeliveryWithRelations) => (
                        <div key={delivery.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{delivery.merchant.name}</h3>
                              <p className="text-sm text-gray-600">{delivery.merchant.address}</p>
                            </div>
                            <Badge variant={delivery.status === 'completed' ? 'default' : 'secondary'}>
                              {getStatusText(delivery.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{delivery.description}</p>
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Cliente:</span>
                              {delivery.customerName}
                              {delivery.customerPhone && (
                                <span className="text-gray-500">• {delivery.customerPhone}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {delivery.deliveryAddress}
                            </div>
                            {delivery.paymentMethod && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">Pagamento:</span>
                                {delivery.paymentMethod === 'dinheiro' ? 'Dinheiro' : 
                                 delivery.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                                 delivery.paymentMethod === 'cartao_debito' ? 'Cartão de Débito' :
                                 delivery.paymentMethod === 'pix' ? 'PIX' :
                                 delivery.paymentMethod === 'cartao_refeicao' ? 'Cartão Refeição' :
                                 delivery.paymentMethod === 'vale_alimentacao' ? 'Vale Alimentação' :
                                 delivery.paymentMethod}
                              </div>
                            )}
                          </div>
                          {delivery.status === 'in_progress' && (
                            <div className="flex justify-end">
                              <DeliveryManagementModal delivery={delivery}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Gerenciar
                                </Button>
                              </DeliveryManagementModal>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDeliveries || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completedDeliveries || 0} concluídas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregas Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayDeliveries || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingDeliveries || 0} em andamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ganhos Hoje</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {(Number(stats.todayEarnings) || 0).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Meta: R$ 150,00
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(Number(stats.averageRating) || 0).toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    ⭐ de 5 estrelas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ganhos da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.weeklyEarnings && stats.weeklyEarnings.map((earning: number, index: number) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - index));
                    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dayName}</span>
                        <span className="text-sm">R$ {Number(earning).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Ganhos</span>
                    <span className="text-lg font-bold">R$ {(Number(stats.totalEarnings) || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ganhos Hoje</span>
                    <span className="text-lg font-bold text-green-600">R$ {(Number(stats.todayEarnings) || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Média por Entrega</span>
                    <span className="text-lg font-bold">
                      R$ {stats.totalDeliveries > 0 ? (Number(stats.totalEarnings) / Number(stats.totalDeliveries)).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metas e Objetivos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Meta Diária</span>
                      <span className="text-sm">R$ {(Number(stats.todayEarnings) || 0).toFixed(2)} / R$ 150,00</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((Number(stats.todayEarnings) || 0) / 150 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Meta Semanal</span>
                      <span className="text-sm">R$ {((stats.weeklyEarnings || []).reduce((a: number, b: number) => Number(a) + Number(b), 0)).toFixed(2)} / R$ 1.000,00</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((stats.weeklyEarnings || []).reduce((a: number, b: number) => Number(a) + Number(b), 0) / 1000 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Dica:</strong> Mantenha-se online nos horários de pico (11h-14h e 18h-21h) para maximizar seus ganhos!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="commission" className="space-y-4">
            <CommissionReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}