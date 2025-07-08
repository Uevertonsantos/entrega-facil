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
import { MapPin, Clock, DollarSign, Package, Plus, Store, Phone, User } from "lucide-react";
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

  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ['/api/merchants/current'],
    retry: false,
  });

  const { data: myDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/my-requests'],
    enabled: !!merchant,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  const { data: activeDeliverers = [] } = useQuery({
    queryKey: ['/api/deliverers/active'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
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
      const deliveryData = {
        ...data,
        merchantId: merchant.id,
        pickupAddress: merchant.address,
        price: parseFloat(data.estimatedValue),
        status: 'pending',
      };
      
      await apiRequest("/api/deliveries", {
        method: "POST",
        body: JSON.stringify(deliveryData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/available'] });
      setIsModalOpen(false);
      form.reset();
      toast({
        title: "Entrega solicitada!",
        description: "Sua solicitação foi enviada para os entregadores disponíveis.",
      });
    },
    onError: (error) => {
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
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Você não está registrado como comerciante.</p>
            <p className="text-sm text-gray-500">Entre em contato com o administrador para ser cadastrado.</p>
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
                                  <Input placeholder="(xx) xxxxx-xxxx" {...field} />
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
                                  <Input placeholder="Rua, número, bairro" {...field} />
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
                                <FormLabel>Valor da Entrega (R$)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="10.00" {...field} />
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
                                <FormLabel>Observações (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Instruções especiais, referências, etc." {...field} />
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
                            <Badge className="bg-green-100 text-green-800">
                              R$ {Number(delivery.price).toFixed(2).replace('.', ',')}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>Para: {delivery.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>Telefone: {delivery.customerPhone}</span>
                            </div>
                            {delivery.deliverer && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Entregador: {delivery.deliverer.name}</span>
                              </div>
                            )}
                            {delivery.notes && (
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5" />
                                <span>Obs: {delivery.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {delivery.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelDelivery(delivery.id)}
                              disabled={cancelDeliveryMutation.isPending}
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