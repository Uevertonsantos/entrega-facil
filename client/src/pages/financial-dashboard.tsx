import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, TrendingUp, DollarSign, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function FinancialDashboard() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [delivererFilter, setDelivererFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch financial summary
  const { data: financialSummary } = useQuery({
    queryKey: ['/api/admin/financial-summary'],
    refetchInterval: 30000,
  });

  // Fetch merchant payments
  const { data: merchantPayments = [] } = useQuery({
    queryKey: ['/api/admin/merchant-payments'],
    refetchInterval: 30000,
  });

  // Fetch deliverer payments
  const { data: delivererPayments = [] } = useQuery({
    queryKey: ['/api/admin/deliverer-payments'],
    refetchInterval: 30000,
  });

  // Fetch merchants for filter
  const { data: merchants = [] } = useQuery({
    queryKey: ['/api/merchants'],
  });

  // Fetch deliverers for filter
  const { data: deliverers = [] } = useQuery({
    queryKey: ['/api/deliverers'],
  });

  const handleUpdatePaymentStatus = async (paymentId: number, status: string, type: 'merchant' | 'deliverer') => {
    try {
      const endpoint = type === 'merchant' 
        ? `/api/admin/merchant-payments/${paymentId}/status`
        : `/api/admin/deliverer-payments/${paymentId}/status`;
      
      await apiRequest(endpoint, 'PUT', { status });
      
      toast({
        title: "Status atualizado!",
        description: `Pagamento marcado como ${status === 'paid' ? 'pago' : 'pendente'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive",
      });
    }
  };

  // Filter merchant payments
  const filteredMerchantPayments = merchantPayments.filter(payment => {
    if (merchantFilter !== "all" && payment.merchantId !== parseInt(merchantFilter)) return false;
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    return true;
  });

  // Filter deliverer payments
  const filteredDelivererPayments = delivererPayments.filter(payment => {
    if (delivererFilter !== "all" && payment.delivererId !== parseInt(delivererFilter)) return false;
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    return true;
  });

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Módulo Financeiro</h1>
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-5 h-5" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total movimentado na plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão da Plataforma</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialSummary?.totalCommission || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita da plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Users className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(
                (financialSummary?.pendingMerchantPayments || 0) + 
                (financialSummary?.pendingDelivererPayments || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Realizados</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                (financialSummary?.paidMerchantPayments || 0) + 
                (financialSummary?.paidDelivererPayments || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different payment types */}
      <Tabs defaultValue="merchants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="merchants">Pagamentos de Comerciantes</TabsTrigger>
          <TabsTrigger value="deliverers">Pagamentos de Entregadores</TabsTrigger>
          <TabsTrigger value="summary">Resumo Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="merchants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Controle de Pagamentos - Comerciantes</CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={merchantFilter} onValueChange={setMerchantFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por comerciante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os comerciantes</SelectItem>
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant.id} value={merchant.id.toString()}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comerciante</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Entregas</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchantPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.merchantName}</TableCell>
                      <TableCell>
                        {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                      </TableCell>
                      <TableCell>{payment.totalDeliveries}</TableCell>
                      <TableCell>{formatCurrency(payment.totalValue)}</TableCell>
                      <TableCell>{formatCurrency(payment.commissionAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={payment.status === 'paid' ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => handleUpdatePaymentStatus(
                            payment.id,
                            payment.status === 'paid' ? 'pending' : 'paid',
                            'merchant'
                          )}
                        >
                          {payment.status === 'paid' ? 'Marcar Pendente' : 'Marcar Pago'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Controle de Pagamentos - Entregadores</CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={delivererFilter} onValueChange={setDelivererFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por entregador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os entregadores</SelectItem>
                      {deliverers.map((deliverer) => (
                        <SelectItem key={deliverer.id} value={deliverer.id.toString()}>
                          {deliverer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entregador</TableHead>
                    <TableHead>Comerciante</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelivererPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.delivererName}</TableCell>
                      <TableCell>{payment.merchantName}</TableCell>
                      <TableCell>{formatCurrency(payment.totalValue)}</TableCell>
                      <TableCell>{formatCurrency(payment.commissionAmount)}</TableCell>
                      <TableCell>{formatCurrency(payment.delivererAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={payment.status === 'paid' ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => handleUpdatePaymentStatus(
                            payment.id,
                            payment.status === 'paid' ? 'pending' : 'paid',
                            'deliverer'
                          )}
                        >
                          {payment.status === 'paid' ? 'Marcar Pendente' : 'Marcar Pago'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total de Entregas:</span>
                  <span className="font-bold">{financialSummary?.totalDeliveries || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Receita Total:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(financialSummary?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Comissão da Plataforma:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(financialSummary?.totalCommission || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pagamentos aos Entregadores:</span>
                  <span className="font-bold">
                    {formatCurrency(financialSummary?.totalDelivererPayments || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Pagamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Comerciantes - Pendente:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(financialSummary?.pendingMerchantPayments || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Comerciantes - Pago:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(financialSummary?.paidMerchantPayments || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Entregadores - Pendente:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(financialSummary?.pendingDelivererPayments || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Entregadores - Pago:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(financialSummary?.paidDelivererPayments || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}