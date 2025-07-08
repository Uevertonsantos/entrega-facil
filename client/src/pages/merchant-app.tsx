import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Clock, DollarSign, Package, Plus, Store, Phone, User, LogOut, Settings, BarChart3, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DeliveryWithRelations, Merchant } from "@shared/schema";
import MerchantReports from "./merchant-reports";
import NewDeliveryModal from "@/components/modals/new-delivery-modal";

const deliveryFormSchema = z.object({
  customerName: z.string().min(2, "Nome do cliente deve ter pelo menos 2 caracteres"),
  customerPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  deliveryAddress: z.string().min(5, "Endereço de entrega deve ter pelo menos 5 caracteres"),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedValue: z.string().min(1, "Valor estimado é obrigatório"),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

export default function MerchantApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const { data: merchantResponse, isLoading: merchantLoading } = useQuery({
    queryKey: ['/api/merchants/current'],
    retry: false,
  });

  const merchant = merchantResponse?.isMerchant ? merchantResponse : null;

  const { data: myDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/my-requests'],
    enabled: !!merchant,
  });

  const { data: activeDeliverers = [] } = useQuery({
    queryKey: ['/api/deliverers/active'],
  });

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      notes: "",
      priority: "medium",
      estimatedValue: "",
    },
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => {
      await apiRequest("POST", "/api/deliveries", {
        ...data,
        merchantId: merchant?.id,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-requests'] });
      form.reset();
      setIsModalOpen(false);
      toast({
        title: "Entrega solicitada",
        description: "Sua solicitação foi enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      await apiRequest("PATCH", `/api/deliveries/${deliveryId}`, {
        status: 'cancelled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-requests'] });
      toast({
        title: "Entrega cancelada",
        description: "A entrega foi cancelada com sucesso.",
      });
    },
  });

  const handleSubmit = (data: DeliveryFormData) => {
    createDeliveryMutation.mutate(data);
  };

  const handleCancelDelivery = (deliveryId: number) => {
    if (confirm('Tem certeza que deseja cancelar esta entrega?')) {
      cancelDeliveryMutation.mutate(deliveryId);
    }
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
      case 'pending': return 'Aguardando entregador';
      case 'accepted': return 'Aceita - Entregador a caminho';
      case 'in_transit': return 'Em trânsito';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  if (merchantLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-blue-600">Área do Comerciante</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Você não está registrado como comerciante.</p>
            <p className="text-sm text-gray-500 mb-6">Entre em contato com o administrador para ser cadastrado e começar a solicitar entregas para seus clientes.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Portal do Comerciante</h1>
              <p className="text-sm text-gray-500">
                {merchant ? `${merchant.name} - ${merchant.businessType}` : 'Carregando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Entregadores Online</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-semibold">{activeDeliverers.length}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSwitchUser}>
              <Settings className="h-4 w-4 mr-2" />
              Trocar Usuário
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="p-6">
        <Tabs defaultValue="deliveries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Entregas
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="deliveries" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregas Hoje</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myDeliveries.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {myDeliveries.filter(d => d.status === 'pending').length} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregas Concluídas</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {myDeliveries.filter(d => d.status === 'delivered').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {myDeliveries.length > 0 ? 
                      Math.round((myDeliveries.filter(d => d.status === 'delivered').length / myDeliveries.length) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {myDeliveries.reduce((sum, d) => sum + (d.estimatedValue || 0), 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor estimado total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Solicitar Nova Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Entrega
                </Button>
              </CardContent>
            </Card>

            {/* Modal de Nova Entrega */}
            <NewDeliveryModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />

            {/* My Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>Minhas Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myDeliveries.map((delivery: DeliveryWithRelations) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">#{delivery.id} - {delivery.customerName}</h3>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusText(delivery.status)}
                          </Badge>
                          <Badge className={getPriorityColor(delivery.priority)}>
                            {getPriorityText(delivery.priority)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {delivery.deliveryAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {delivery.customerPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            R$ {delivery.estimatedValue?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        {delivery.deliverer && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <User className="h-4 w-4" />
                            Entregador: {delivery.deliverer.name}
                          </div>
                        )}
                        {delivery.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Observações:</strong> {delivery.notes}
                          </div>
                        )}
                      </div>
                      {delivery.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelDelivery(delivery.id)}
                          disabled={cancelDeliveryMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  ))}
                  {myDeliveries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma entrega encontrada. Solicite sua primeira entrega!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <MerchantReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}