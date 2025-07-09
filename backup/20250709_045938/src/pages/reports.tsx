import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, BarChart3, Download, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function Reports() {
  const [dateRange, setDateRange] = useState("today");
  const [reportType, setReportType] = useState("deliveries");

  const mockData = {
    deliveries: {
      total: 47,
      completed: 42,
      pending: 5,
      cancelled: 0,
      avgTime: "23 min",
      growth: "+12%"
    },
    revenue: {
      total: 423.00,
      merchants: 318.00,
      deliverers: 105.00,
      growth: "+8%"
    },
    performance: {
      bestDeliverer: "Carlos Santos",
      bestMerchant: "Padaria do João",
      avgRating: 4.8,
      efficiency: "94%"
    }
  };

  const generateReport = () => {
    // Em uma aplicação real, isso geraria um PDF ou Excel
    console.log(`Generating ${reportType} report for ${dateRange}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
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
              <SelectItem value="quarter">Este Trimestre</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <FileText className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deliveries">Entregas</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={generateReport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{mockData.deliveries.total}</span>
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                {mockData.deliveries.growth}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">R$ {mockData.revenue.total.toFixed(2)}</span>
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                {mockData.revenue.growth}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{mockData.deliveries.avgTime}</span>
              <Badge className="bg-blue-100 text-blue-800">
                <BarChart3 className="h-3 w-3 mr-1" />
                Estável
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Eficiência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{mockData.performance.efficiency}</span>
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries Report */}
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Entregas Concluídas</p>
                  <p className="text-sm text-gray-600">89% das entregas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{mockData.deliveries.completed}</p>
                  <p className="text-sm text-gray-500">de {mockData.deliveries.total}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Entregas Pendentes</p>
                  <p className="text-sm text-gray-600">11% das entregas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{mockData.deliveries.pending}</p>
                  <p className="text-sm text-gray-500">aguardando</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Entregas Canceladas</p>
                  <p className="text-sm text-gray-600">0% das entregas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{mockData.deliveries.cancelled}</p>
                  <p className="text-sm text-gray-500">canceladas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Report */}
        <Card>
          <CardHeader>
            <CardTitle>Relatório Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Receita de Comerciantes</p>
                  <p className="text-sm text-gray-600">75% da receita total</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">R$ {mockData.revenue.merchants.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">faturado</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Pagamento Entregadores</p>
                  <p className="text-sm text-gray-600">25% da receita total</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">R$ {mockData.revenue.deliverers.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">repassado</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Lucro Líquido</p>
                  <p className="text-sm text-gray-600">Receita - Repasses</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">R$ {(mockData.revenue.total - mockData.revenue.deliverers).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">lucro</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">CS</span>
              </div>
              <p className="font-medium">Melhor Entregador</p>
              <p className="text-sm text-gray-600">{mockData.performance.bestDeliverer}</p>
              <p className="text-xs text-gray-500">23 entregas hoje</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">PJ</span>
              </div>
              <p className="font-medium">Melhor Comerciante</p>
              <p className="text-sm text-gray-600">{mockData.performance.bestMerchant}</p>
              <p className="text-xs text-gray-500">18 pedidos hoje</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-2xl">★</span>
              </div>
              <p className="font-medium">Avaliação Média</p>
              <p className="text-sm text-gray-600">{mockData.performance.avgRating}/5.0</p>
              <p className="text-xs text-gray-500">baseado em 127 avaliações</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <p className="font-medium">Eficiência Geral</p>
              <p className="text-sm text-gray-600">{mockData.performance.efficiency}</p>
              <p className="text-xs text-gray-500">meta: 90%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Entregas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Gráfico de Performance</p>
              <p className="text-sm text-gray-500">Integração com biblioteca de gráficos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
