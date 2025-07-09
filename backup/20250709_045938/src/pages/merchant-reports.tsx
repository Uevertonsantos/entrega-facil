import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Package, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DeliveryWithRelations } from "@shared/schema";

export default function MerchantReports() {
  const [dateFilter, setDateFilter] = useState("last7days");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: deliveries = [], isLoading } = useQuery<DeliveryWithRelations[]>({
    queryKey: ['/api/deliveries/my-requests'],
    retry: false,
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    const deliveryDate = new Date(delivery.createdAt);
    const now = new Date();
    
    // Filter by date
    let dateMatch = true;
    if (dateFilter === "last7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = deliveryDate >= sevenDaysAgo;
    } else if (dateFilter === "last30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateMatch = deliveryDate >= thirtyDaysAgo;
    }
    
    // Filter by status
    let statusMatch = true;
    if (statusFilter !== "all") {
      statusMatch = delivery.status === statusFilter;
    }
    
    return dateMatch && statusMatch;
  });

  const stats = {
    total: filteredDeliveries.length,
    pending: filteredDeliveries.filter(d => d.status === 'pending').length,
    inProgress: filteredDeliveries.filter(d => d.status === 'in_transit').length,
    delivered: filteredDeliveries.filter(d => d.status === 'delivered').length,
    cancelled: filteredDeliveries.filter(d => d.status === 'cancelled').length,
    totalValue: filteredDeliveries.reduce((sum, d) => sum + (d.estimatedValue || 0), 0),
    avgDeliveryTime: calculateAverageDeliveryTime(filteredDeliveries.filter(d => d.status === 'delivered')),
  };

  function calculateAverageDeliveryTime(deliveredOrders: DeliveryWithRelations[]): number {
    if (deliveredOrders.length === 0) return 0;
    
    const totalTime = deliveredOrders.reduce((sum, delivery) => {
      const created = new Date(delivery.createdAt);
      const delivered = delivery.deliveredAt ? new Date(delivery.deliveredAt) : new Date();
      return sum + (delivered.getTime() - created.getTime());
    }, 0);
    
    return Math.round(totalTime / deliveredOrders.length / (1000 * 60)); // Convert to minutes
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatórios de Entregas</h1>
        <p className="text-gray-600">Acompanhe o desempenho das suas entregas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex flex-col">
          <Label htmlFor="date-filter">Período</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Últimos 7 dias</SelectItem>
              <SelectItem value="last30days">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todos os períodos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_transit">Em trânsito</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeliveryTime}min</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `R$ ${(stats.totalValue / stats.total).toFixed(2)}` : 'R$ 0'} por entrega
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entregas</CardTitle>
          <CardDescription>
            Lista detalhada de todas as entregas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entregador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">#{delivery.id}</TableCell>
                  <TableCell>{delivery.customerName}</TableCell>
                  <TableCell className="max-w-xs truncate">{delivery.deliveryAddress}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(delivery.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(delivery.status)}
                        {getStatusText(delivery.status)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {delivery.deliverer ? delivery.deliverer.name : 'Não atribuído'}
                  </TableCell>
                  <TableCell>R$ {delivery.estimatedValue?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {format(new Date(delivery.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredDeliveries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma entrega encontrada no período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}