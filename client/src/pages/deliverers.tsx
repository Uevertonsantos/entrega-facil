import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Plus, 
  Edit, 
  MessageSquare, 
  Search,
  Phone,
  Route,
  DollarSign,
  Clock,
  Trash2
} from "lucide-react";
import type { Deliverer } from "@shared/schema";

const delivererFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  isActive: z.boolean(),
  isOnline: z.boolean(),
});

type DelivererFormData = z.infer<typeof delivererFormSchema>;

export default function Deliverers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewDelivererOpen, setIsNewDelivererOpen] = useState(false);
  const [editingDeliverer, setEditingDeliverer] = useState<Deliverer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: deliverers, isLoading } = useQuery<Deliverer[]>({
    queryKey: ["/api/deliverers"],
    retry: false,
  });

  const form = useForm<DelivererFormData>({
    resolver: zodResolver(delivererFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      isActive: true,
      isOnline: false,
    },
  });

  const createDelivererMutation = useMutation({
    mutationFn: async (data: DelivererFormData) => {
      await apiRequest("/api/deliverers", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Entregador criado",
        description: "O entregador foi criado com sucesso.",
      });
      setIsNewDelivererOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao criar entregador. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateDelivererMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DelivererFormData> }) => {
      await apiRequest(`/api/deliverers/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Entregador atualizado",
        description: "O entregador foi atualizado com sucesso.",
      });
      setEditingDeliverer(null);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao atualizar entregador. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteDelivererMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/deliverers/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Entregador excluído",
        description: "O entregador foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao excluir entregador. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DelivererFormData) => {
    if (editingDeliverer) {
      updateDelivererMutation.mutate({ id: editingDeliverer.id, data });
    } else {
      createDelivererMutation.mutate(data);
    }
  };

  const handleEdit = (deliverer: Deliverer) => {
    setEditingDeliverer(deliverer);
    form.reset({
      name: deliverer.name,
      phone: deliverer.phone,
      isActive: deliverer.isActive,
      isOnline: deliverer.isOnline,
    });
  };

  const handleToggleOnline = (deliverer: Deliverer) => {
    updateDelivererMutation.mutate({
      id: deliverer.id,
      data: { isOnline: !deliverer.isOnline }
    });
  };

  const handleDelete = (deliverer: Deliverer) => {
    if (window.confirm(`Tem certeza que deseja excluir o entregador "${deliverer.name}"?`)) {
      deleteDelivererMutation.mutate(deliverer.id);
    }
  };

  const handleWhatsAppMessage = (phone: string, delivererName: string) => {
    const message = `Olá ${delivererName}, você tem novas entregas disponíveis. Acesse o sistema para mais detalhes.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredDeliverers = deliverers?.filter(deliverer =>
    deliverer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deliverer.phone.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Entregadores</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Entregadores</h1>
        <Dialog open={isNewDelivererOpen} onOpenChange={setIsNewDelivererOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Entregador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDeliverer ? "Editar Entregador" : "Novo Entregador"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel>Ativo</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isOnline"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel>Online</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNewDelivererOpen(false);
                      setEditingDeliverer(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createDelivererMutation.isPending || updateDelivererMutation.isPending}
                  >
                    {editingDeliverer ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar entregadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Deliverers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeliverers?.map((deliverer) => (
          <Card key={deliverer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {deliverer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{deliverer.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-3 w-3 mr-1" />
                      {deliverer.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${deliverer.isOnline ? 'bg-secondary' : 'bg-gray-400'}`} />
                  <Badge variant={deliverer.isActive ? "default" : "secondary"}>
                    {deliverer.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={deliverer.isOnline ? "bg-secondary" : "bg-gray-400"}>
                    {deliverer.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Entregas ativas:</span>
                  <span className="font-medium">{deliverer.currentDeliveries}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cadastrado em:</span>
                  <span className="font-medium">
                    {new Date(deliverer.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleOnline(deliverer)}
                    disabled={updateDelivererMutation.isPending}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {deliverer.isOnline ? "Offline" : "Online"}
                  </Button>
                  
                  <Dialog 
                    open={editingDeliverer?.id === deliverer.id} 
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingDeliverer(null);
                        form.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(deliverer)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Editar Entregador</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: João Silva" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(11) 99999-9999" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex items-center justify-between">
                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormLabel>Ativo</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isOnline"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormLabel>Online</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingDeliverer(null);
                                form.reset();
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateDelivererMutation.isPending}
                            >
                              Atualizar
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(deliverer)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={deleteDelivererMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!filteredDeliverers || filteredDeliverers.length === 0) && (
          <div className="col-span-full">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  {searchTerm 
                    ? "Nenhum entregador encontrado com o termo pesquisado"
                    : "Nenhum entregador cadastrado"
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
