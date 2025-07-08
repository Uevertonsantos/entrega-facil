import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Filter, Package, Clock, CheckCircle, X } from "lucide-react";
import NewDeliveryModal from "@/components/modals/new-delivery-modal";
import type { DeliveryWithRelations } from "@shared/schema";

export default function Deliveries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: deliveries, isLoading } = useQuery<DeliveryWithRelations[]>({
    queryKey: ["/api/deliveries"],
    retry: false,
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliveryWithRelations> }) => {
      await apiRequest("PUT", `/api/deliveries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Entrega atualizada",
        description: "A entrega foi atualizada com sucesso.",
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
        description: "Erro ao atualizar entrega. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/deliveries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Entrega excluída",
        description: "A entrega foi excluída com sucesso.",
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
        description: "Erro ao excluir entrega. Tente novamente.",
        variant: "destructive",
      });
    },
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_route":
        return Package;
      case "pending":
        return Clock;
      default:
        return Package;
    }
  };

  const filteredDeliveries = deliveries?.filter(delivery => {
    const matchesSearch = delivery.merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Entregas</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
        <Button
          onClick={() => setIsNewDeliveryOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrega
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por comerciante, endereço ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_route">Em Rota</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries?.map((delivery) => {
          const StatusIcon = getStatusIcon(delivery.status);
          return (
            <Card key={delivery.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(delivery.status)}`}>
                      <StatusIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {delivery.merchant.name}
                        </h3>
                        <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                          {getStatusLabel(delivery.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Para: {delivery.customerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {delivery.deliveryAddress}
                      </p>
                      {delivery.deliverer && (
                        <p className="text-sm text-gray-500">
                          Entregador: {delivery.deliverer.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        R$ {delivery.deliveryFee}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(delivery.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      {delivery.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryMutation.mutate({
                            id: delivery.id,
                            data: { status: "in_route" }
                          })}
                          disabled={updateDeliveryMutation.isPending}
                        >
                          Iniciar Rota
                        </Button>
                      )}
                      
                      {delivery.status === "in_route" && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryMutation.mutate({
                            id: delivery.id,
                            data: { status: "completed", completedAt: new Date() }
                          })}
                          disabled={updateDeliveryMutation.isPending}
                        >
                          Concluir
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDeliveryMutation.mutate(delivery.id)}
                        disabled={deleteDeliveryMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {(!filteredDeliveries || filteredDeliveries.length === 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Nenhuma entrega encontrada com os filtros aplicados"
                  : "Nenhuma entrega encontrada"
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Delivery Modal */}
      <NewDeliveryModal
        isOpen={isNewDeliveryOpen}
        onClose={() => setIsNewDeliveryOpen(false)}
      />
    </div>
  );
}
