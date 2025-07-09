import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, FileText, DollarSign, TrendingUp, TrendingDown, User, Building2, CheckCircle, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DeliveryFinancialData {
  id: number;
  merchantName: string;
  deliveryValue: number;
  platformFee: number;
  delivererAmount: number;
  status: string;
  completedAt: string;
  paymentMethod: string;
  pickupAddress: string;
  deliveryAddress: string;
}

interface FinancialSummary {
  totalDeliveries: number;
  totalEarned: number;
  totalPlatformFees: number;
  totalReceived: number;
  totalPending: number;
  completedDeliveries: number;
  currentMonthEarnings: number;
  lastMonthEarnings: number;
}

export default function DelivererFinancialReport() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [merchantFilter, setMerchantFilter] = useState<string>('all');

  // Dados financeiros do entregador
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ['/api/deliverers/financial-report', startDate, endDate, statusFilter, merchantFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (merchantFilter !== 'all') params.append('merchant', merchantFilter);
      
      const response = await apiRequest(`/api/deliverers/financial-report?${params}`, 'GET');
      return response;
    },
  });

  // Resumo financeiro
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['/api/deliverers/financial-summary'],
    queryFn: async () => {
      const response = await apiRequest('/api/deliverers/financial-summary', 'GET');
      return response;
    },
  });

  // Lista de comerciantes para filtro
  const { data: merchants = [], isLoading: isLoadingMerchants } = useQuery({
    queryKey: ['/api/deliverers/merchants'],
    queryFn: async () => {
      const response = await apiRequest('/api/deliverers/merchants', 'GET');
      return response;
    },
  });

  const deliveries: DeliveryFinancialData[] = financialData?.deliveries || [];
  const financialSummary: FinancialSummary = summary || {
    totalDeliveries: 0,
    totalEarned: 0,
    totalPlatformFees: 0,
    totalReceived: 0,
    totalPending: 0,
    completedDeliveries: 0,
    currentMonthEarnings: 0,
    lastMonthEarnings: 0
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      deliveries.map(delivery => ({
        'ID': delivery.id,
        'Comerciante': delivery.merchantName,
        'Valor da Entrega': `R$ ${delivery.deliveryValue.toFixed(2)}`,
        'Taxa da Plataforma': `R$ ${delivery.platformFee.toFixed(2)}`,
        'Valor do Entregador': `R$ ${delivery.delivererAmount.toFixed(2)}`,
        'Status': delivery.status,
        'Data Conclusão': delivery.completedAt ? format(new Date(delivery.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
        'Método Pagamento': delivery.paymentMethod,
        'Endereço Coleta': delivery.pickupAddress,
        'Endereço Entrega': delivery.deliveryAddress
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Financeiro');
    
    const fileName = `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Relatório exportado!",
      description: "O arquivo Excel foi baixado com sucesso.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório Financeiro - Entregador', 20, 20);
    
    // Resumo
    doc.setFontSize(12);
    doc.text(`Total de Entregas: ${financialSummary.totalDeliveries}`, 20, 40);
    doc.text(`Total Ganho: R$ ${financialSummary.totalEarned.toFixed(2)}`, 20, 50);
    doc.text(`Total Taxa da Plataforma: R$ ${financialSummary.totalPlatformFees.toFixed(2)}`, 20, 60);
    doc.text(`Total Recebido: R$ ${financialSummary.totalReceived.toFixed(2)}`, 20, 70);
    doc.text(`Total Pendente: R$ ${financialSummary.totalPending.toFixed(2)}`, 20, 80);
    
    // Tabela de entregas
    const tableData = deliveries.map(delivery => [
      delivery.id.toString(),
      delivery.merchantName,
      `R$ ${delivery.deliveryValue.toFixed(2)}`,
      `R$ ${delivery.platformFee.toFixed(2)}`,
      `R$ ${delivery.delivererAmount.toFixed(2)}`,
      delivery.status,
      delivery.completedAt ? format(new Date(delivery.completedAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'
    ]);

    autoTable(doc, {
      head: [['ID', 'Comerciante', 'Valor', 'Taxa', 'Entregador', 'Status', 'Data']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 }
      }
    });
    
    const fileName = `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Relatório exportado!",
      description: "O arquivo PDF foi baixado com sucesso.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><TrendingUp className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {financialSummary.totalEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{financialSummary.totalDeliveries} entregas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa da Plataforma</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {financialSummary.totalPlatformFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Descontado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ {financialSummary.totalReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {financialSummary.totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">A receber</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="merchant">Comerciante</Label>
              <Select value={merchantFilter} onValueChange={setMerchantFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os comerciantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os comerciantes</SelectItem>
                  {Array.isArray(merchants) && merchants.map((merchant: any) => (
                    <SelectItem key={merchant.id} value={merchant.id.toString()}>
                      {merchant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={exportToExcel} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportar para Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar para PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFinancial ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Comerciante</TableHead>
                    <TableHead>Valor da Entrega</TableHead>
                    <TableHead>Taxa da Plataforma</TableHead>
                    <TableHead>Valor do Entregador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Conclusão</TableHead>
                    <TableHead>Método Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhuma entrega encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">#{delivery.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {delivery.merchantName}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          R$ {delivery.deliveryValue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          R$ {delivery.platformFee.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          R$ {delivery.delivererAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(delivery.status)}
                        </TableCell>
                        <TableCell>
                          {delivery.completedAt ? format(new Date(delivery.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{delivery.paymentMethod}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}