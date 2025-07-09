import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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
import NewDelivererModal from "@/components/modals/new-deliverer-modal";



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





  const updateDelivererMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
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
        <Button 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => setIsNewDelivererOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Entregador
        </Button>
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
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
      
      <NewDelivererModal
        isOpen={isNewDelivererOpen}
        onClose={() => setIsNewDelivererOpen(false)}
      />
    </div>
  );
}
