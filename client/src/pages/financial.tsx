import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Users, 
  Store,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import type { Merchant, Deliverer, DeliveryWithRelations } from "@shared/schema";

export default function Financial() {
  const [dateRange, setDateRange] = useState("month");
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: merchants, isLoading: merchantsLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
    retry: false,
  });

  const { data: deliverers, isLoading: deliverersLoading } = useQuery<Deliverer[]>({
    queryKey: ["/api/deliverers"],
    retry: false,
  });

  const { data: deliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithRelations[]>({
    queryKey: ["/api/deliveries"],
    retry: false,
  });

  // Calcular métricas financeiras
  const completedDeliveries = deliveries?.filter(d => d.status === "completed") || [];
  const totalRevenue = completedDeliveries.reduce((sum, d) => sum + parseFloat(d.deliveryFee.toString()), 0);
  const totalDelivererPayments = completedDeliveries.reduce((sum, d) => sum + (parseFloat(d.delivererPayment?.toString() || "0")), 0);
  const netProfit = totalRevenue - totalDelivererPayments;

  // Calcular receita por comerciante
  const revenueByMerchant = merchants?.map(merchant => {
    const merchantDeliveries = completedDeliveries.filter(d => d.merchantId === merchant.id);
    const revenue = merchantDeliveries.reduce((sum, d) => sum + parseFloat(d.deliveryFee.toString()), 0);
    const deliveryCount = merchantDeliveries.length;
    
    return {
      merchant,
      revenue,
      deliveryCount,
      avgOrderValue: deliveryCount > 0 ? revenue / deliveryCount : 0
    };
  }).sort((a, b) => b.revenue - a.revenue) || [];

  // Calcular pagamentos por entregador
  const paymentsByDeliverer = deliverers?.map(deliverer => {
    const delivererDeliveries = completedDeliveries.filter(d => d.delivererId === deliverer.id);
    const totalPayment = delivererDeliveries.reduce((sum, d) => sum + (parseFloat(d.delivererPayment?.toString() || "0")), 0);
    const deliveryCount = delivererDeliveries.length;
    
    return {
      deliverer,
      totalPayment,
      deliveryCount,
      avgPayment: deliveryCount > 0 ? totalPayment / deliveryCount : 0
    };
  }).sort((a, b) => b.totalPayment - a.totalPayment) || [];

  const handleExportReport = () => {
    // Aqui seria implementada a exportação real
    console.log("Exporting financial report...");
  };

  if (statsLoading || merchantsLoading || deliverersLoading || deliveriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExportReport}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">
                R$ {totalRevenue.toFixed(2)}
              </span>
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Pagamentos Entregadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                R$ {totalDelivererPayments.toFixed(2)}
              </span>
              <Badge className="bg-blue-100 text-blue-800">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                R$ {netProfit.toFixed(2)}
              </span>
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Store className="h-4 w-4 mr-1" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                R$ {completedDeliveries.length > 0 ? (totalRevenue / completedDeliveries.length).toFixed(2) : "0.00"}
              </span>
              <Badge className="bg-blue-100 text-blue-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Merchant */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Comerciante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Comerciante</th>
                  <th className="text-left py-3 px-4">Plano</th>
                  <th className="text-left py-3 px-4">Entregas</th>
                  <th className="text-left py-3 px-4">Receita</th>
                  <th className="text-left py-3 px-4">Ticket Médio</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueByMerchant.map(({ merchant, revenue, deliveryCount, avgOrderValue }) => (
                  <tr key={merchant.id} className="border-b">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                          <Store className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{merchant.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{merchant.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {merchant.planType === "monthly" ? "Mensal" : "Por Entrega"}
                      <div className="text-xs text-gray-500">
                        R$ {merchant.planValue.toString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {deliveryCount} entregas
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-green-600">
                      R$ {revenue.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      R$ {avgOrderValue.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={merchant.isActive ? "bg-secondary" : "bg-gray-400"}>
                        {merchant.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {revenueByMerchant.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum comerciante encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments by Deliverer */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos por Entregador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentsByDeliverer.map(({ deliverer, totalPayment, deliveryCount, avgPayment }) => (
              <div key={deliverer.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {deliverer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{deliverer.name}</p>
                      <p className="text-sm text-gray-500">{deliverer.phone}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${deliverer.isOnline ? 'bg-secondary' : 'bg-gray-400'}`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Recebido:</span>
                    <span className="text-sm font-medium text-green-600">
                      R$ {totalPayment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Entregas:</span>
                    <span className="text-sm font-medium">{deliveryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Média por Entrega:</span>
                    <span className="text-sm font-medium">
                      R$ {avgPayment.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {paymentsByDeliverer.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhum entregador encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <ArrowDownRight className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Receita Bruta</p>
                    <p className="text-sm text-green-700">Total arrecadado</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-700">
                    {completedDeliveries.length} entregas
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <ArrowUpRight className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">Pagamentos Entregadores</p>
                    <p className="text-sm text-blue-700">Total repassado</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {totalDelivererPayments.toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">
                    {Math.round((totalDelivererPayments / totalRevenue) * 100)}% da receita
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <p className="font-medium text-primary">Lucro Líquido</p>
                    <p className="text-sm text-primary/80">Receita - Pagamentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    R$ {netProfit.toFixed(2)}
                  </p>
                  <p className="text-sm text-primary/80">
                    {Math.round((netProfit / totalRevenue) * 100)}% margem
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Meta Mensal</span>
                  <span className="text-sm text-gray-600">
                    R$ {totalRevenue.toFixed(2)} / R$ 2.000,00
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min((totalRevenue / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Meta de Entregas</span>
                  <span className="text-sm text-gray-600">
                    {completedDeliveries.length} / 200
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-secondary h-2 rounded-full" 
                    style={{ width: `${Math.min((completedDeliveries.length / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Meta de Lucro</span>
                  <span className="text-sm text-gray-600">
                    R$ {netProfit.toFixed(2)} / R$ 1.500,00
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((netProfit / 1500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
