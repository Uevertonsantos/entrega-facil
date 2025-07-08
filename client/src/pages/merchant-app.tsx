import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Clock, DollarSign, Package, Plus, Store, Phone, User, LogOut, Settings } from "lucide-react";
import type { DeliveryWithRelations, Merchant } from "@shared/schema";

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
      await apiRequest('/api/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          merchantId: merchant?.id,
          status: 'pending',
        }),
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
      await apiRequest(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: 'cancelled' }),
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Store className="h-6 w-6" />
                    {merchant.name}
                  </CardTitle>
                  <p className="text-gray-600">Painel do Comerciante</p>
                  <p className="text-sm text-gray-500">{merchant.address}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Entregadores Online</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-semibold">{activeDeliverers.length}</span>
                    </div>
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
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Nova Entrega
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Solicitar Nova Entrega</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="customerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome do Cliente</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite o nome do cliente" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="customerPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Telefone do Cliente</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite o telefone do cliente" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="deliveryAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Endereço de Entrega</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite o endereço completo" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="estimatedValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Valor Estimado (R$)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="0,00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="priority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Prioridade</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a prioridade" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="low">Baixa</SelectItem>
                                      <SelectItem value="medium">Média</SelectItem>
                                      <SelectItem value="high">Alta</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Observações</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Observações adicionais (opcional)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={createDeliveryMutation.isPending}>
                                {createDeliveryMutation.isPending ? "Enviando..." : "Solicitar Entrega"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Minhas Entregas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Minhas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando entregas...</p>
              </div>
            ) : myDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma entrega solicitada ainda</p>
                <p className="text-sm text-gray-500 mt-2">Clique em "Nova Entrega" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myDeliveries.map((delivery: DeliveryWithRelations) => (
                  <Card key={delivery.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{delivery.customerName}</h3>
                            <Badge className={getStatusColor(delivery.status)}>
                              {getStatusText(delivery.status)}
                            </Badge>
                            <Badge className={getPriorityColor(delivery.priority)}>
                              {getPriorityText(delivery.priority)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{delivery.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{delivery.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>R$ {delivery.estimatedValue}</span>
                            </div>
                            {delivery.deliverer && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Entregador: {delivery.deliverer.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-500">
                            {new Date(delivery.createdAt).toLocaleDateString('pt-BR')} às {' '}
                            {new Date(delivery.createdAt).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          
                          {delivery.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelDelivery(delivery.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancelar
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