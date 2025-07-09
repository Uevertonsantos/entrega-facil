import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Eye, DollarSign, TrendingUp, Users, FilterX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DelivererPayment {
  id: number;
  deliveryId: number;
  delivererId: number;
  merchantId: number;
  merchantName: string;
  delivererName: string;
  totalValue: string;
  commissionPercentage: string;
  commissionAmount: string;
  delivererAmount: string;
  status: 'pending' | 'paid';
  completedAt: string;
  paidAt?: string;
  createdAt: string;
}

interface PaymentSummary {
  totalPending: number;
  totalPaid: number;
  delivererBalances: {
    delivererId: number;
    delivererName: string;
    pendingAmount: number;
    paidAmount: number;
    totalAmount: number;
  }[];
}

export default function DelivererPaymentsPage() {
  const [selectedDeliverer, setSelectedDeliverer] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDeliverer, setFilterDeliverer] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<DelivererPayment[]>({
    queryKey: ['/api/admin/deliverer-payments'],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<PaymentSummary>({
    queryKey: ['/api/admin/deliverer-payments/summary'],
  });

  const { data: delivererPayments = [], isLoading: delivererPaymentsLoading } = useQuery<DelivererPayment[]>({
    queryKey: ['/api/admin/deliverer-payments/by-deliverer', selectedDeliverer],
    enabled: selectedDeliverer !== null,
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/admin/deliverer-payments/${id}/status`, 'PUT', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deliverer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deliverer-payments/summary'] });
      toast({
        title: "Status atualizado",
        description: "Status do pagamento atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pagamento",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    updatePaymentStatusMutation.mutate({ id, status });
  };

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterDeliverer('all');
  };

  const filteredPayments = payments.filter(payment => {
    let statusMatch = true;
    let delivererMatch = true;
    
    if (filterStatus !== 'all') {
      statusMatch = payment.status === filterStatus;
    }
    
    if (filterDeliverer !== 'all') {
      delivererMatch = payment.delivererId.toString() === filterDeliverer;
    }
    
    return statusMatch && delivererMatch;
  });

  // Get unique deliverers for filter
  const uniqueDeliverers = Array.from(
    new Map(payments.map(p => [p.delivererId, { id: p.delivererId, name: p.delivererName }])).values()
  );

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (paymentsLoading || summaryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Pagamentos de Entregadores</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary?.totalPending || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalPaid || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entregadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.delivererBalances?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((summary?.totalPending || 0) + (summary?.totalPaid || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Pagamentos por Entrega</TabsTrigger>
          <TabsTrigger value="balances">Saldos por Entregador</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDeliverer} onValueChange={setFilterDeliverer}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por entregador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Entregadores</SelectItem>
                {uniqueDeliverers.map((deliverer) => (
                  <SelectItem key={deliverer.id} value={deliverer.id.toString()}>
                    {deliverer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full sm:w-auto"
              disabled={filterStatus === 'all' && filterDeliverer === 'all'}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pagamentos por Entrega</span>
                <div className="text-sm text-muted-foreground">
                  {filteredPayments.length} de {payments.length} registros
                  {(filterStatus !== 'all' || filterDeliverer !== 'all') && (
                    <span className="ml-2 text-blue-600 font-medium">
                      (filtrado)
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Entregador</th>
                      <th className="text-left p-2">Comerciante</th>
                      <th className="text-left p-2">Valor Total</th>
                      <th className="text-left p-2">Taxa (%)</th>
                      <th className="text-left p-2">Comissão</th>
                      <th className="text-left p-2">Valor Entregador</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Completada em</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-2 font-medium">{payment.delivererName}</td>
                        <td className="p-2">{payment.merchantName}</td>
                        <td className="p-2">{formatCurrency(payment.totalValue)}</td>
                        <td className="p-2">{payment.commissionPercentage}%</td>
                        <td className="p-2 text-red-600">{formatCurrency(payment.commissionAmount)}</td>
                        <td className="p-2 text-green-600 font-medium">{formatCurrency(payment.delivererAmount)}</td>
                        <td className="p-2">
                          <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                            {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="p-2">{formatDate(payment.completedAt)}</td>
                        <td className="p-2">
                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(payment.id, 'paid')}
                              disabled={updatePaymentStatusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marcar como Pago
                            </Button>
                          )}
                          {payment.status === 'paid' && (
                            <Badge variant="outline" className="text-green-600">
                              Pago em {payment.paidAt ? formatDate(payment.paidAt) : 'N/A'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPayments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saldos por Entregador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Entregador</th>
                      <th className="text-left p-2">Valor Pendente</th>
                      <th className="text-left p-2">Valor Pago</th>
                      <th className="text-left p-2">Total</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.delivererBalances?.map((balance) => (
                      <tr key={balance.delivererId} className="border-b">
                        <td className="p-2 font-medium">{balance.delivererName}</td>
                        <td className="p-2 text-orange-600">{formatCurrency(balance.pendingAmount)}</td>
                        <td className="p-2 text-green-600">{formatCurrency(balance.paidAmount)}</td>
                        <td className="p-2 font-medium">{formatCurrency(balance.totalAmount)}</td>
                        <td className="p-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDeliverer(balance.delivererId)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes de Pagamento - {balance.delivererName}</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-96 overflow-y-auto">
                                {delivererPaymentsLoading ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                                  </div>
                                ) : (
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left p-2">Comerciante</th>
                                        <th className="text-left p-2">Valor</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Data</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {delivererPayments.map((payment) => (
                                        <tr key={payment.id} className="border-b">
                                          <td className="p-2">{payment.merchantName}</td>
                                          <td className="p-2">{formatCurrency(payment.delivererAmount)}</td>
                                          <td className="p-2">
                                            <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                                              {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                                            </Badge>
                                          </td>
                                          <td className="p-2">{formatDate(payment.completedAt)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!summary?.delivererBalances?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum saldo encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}