import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, TrendingUp, Calendar, MapPin, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlatformCommissionDelivery {
  id: number;
  delivererName: string;
  customerName: string;
  deliveryAddress: string;
  deliveryFee: number;
  commissionPercentage: number;
  commissionAmount: number;
  delivererPayment: number;
  completedAt: string;
  createdAt: string;
}

interface PlatformCommissionTotals {
  totalDeliveryFee: number;
  totalCommission: number;
  totalDelivererPayment: number;
}

interface PlatformCommissionReport {
  deliveries: PlatformCommissionDelivery[];
  totals: PlatformCommissionTotals;
}

export default function PlatformCommissionReport() {
  const { data: report, isLoading } = useQuery<PlatformCommissionReport>({
    queryKey: ['/api/admin/platform-commission-report'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nenhum dado encontrado</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Relatório de Taxa da Plataforma</h2>
        <Badge variant="secondary" className="text-sm">
          {report.deliveries.length} entregas concluídas
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Entregas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(report.totals.totalDeliveryFee)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total movimentado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sua Taxa da Plataforma</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(report.totals.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total de taxa da plataforma recebida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamento aos Entregadores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(report.totals.totalDelivererPayment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total pago aos entregadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entregador</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Taxa da Plataforma (%)</TableHead>
                  <TableHead>Sua Taxa da Plataforma</TableHead>
                  <TableHead>Pagamento Entregador</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">
                      {delivery.delivererName}
                    </TableCell>
                    <TableCell>
                      {delivery.customerName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm truncate max-w-[200px]">
                          {delivery.deliveryAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(delivery.deliveryFee)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {delivery.commissionPercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatCurrency(delivery.commissionAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-orange-600">
                        {formatCurrency(delivery.delivererPayment)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(delivery.completedAt)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Information Note */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Modelo de Comissão da Plataforma
              </h4>
              <p className="text-sm text-green-700">
                A plataforma cobra uma comissão sobre cada entrega realizada pelos entregadores. 
                O percentual é definido no cadastro de cada entregador e é automaticamente descontado 
                do valor total da entrega. O restante é pago diretamente ao entregador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}