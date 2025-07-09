import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, TrendingUp, Calendar, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommissionDelivery {
  id: number;
  customerName: string;
  deliveryAddress: string;
  deliveryFee: number;
  commissionPercentage: number;
  commissionAmount: number;
  delivererPayment: number;
  completedAt: string;
  createdAt: string;
}

interface CommissionTotals {
  totalDeliveryFee: number;
  totalCommission: number;
  totalPayment: number;
}

interface CommissionReport {
  deliveries: CommissionDelivery[];
  totals: CommissionTotals;
  delivererInfo: {
    id: number;
    name: string;
  };
}

export default function CommissionReport() {
  const { data: report, isLoading } = useQuery<CommissionReport>({
    queryKey: ['/api/deliverers/commission-report'],
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
        <h2 className="text-2xl font-bold text-gray-900">Relatório de Comissões</h2>
        <Badge variant="secondary" className="text-sm">
          {report.deliveries.length} entregas concluídas
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Taxas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(report.totals.totalDeliveryFee)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total das taxas de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(report.totals.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total descontado em comissão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seu Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(report.totals.totalPayment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total que você recebeu
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Comissão (%)</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">
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
                      <span className="font-medium text-green-600">
                        {formatCurrency(delivery.deliveryFee)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {delivery.commissionPercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600">
                        -{formatCurrency(delivery.commissionAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
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
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Como funciona a comissão?
              </h4>
              <p className="text-sm text-blue-700">
                A comissão é calculada automaticamente sobre o valor da taxa de entrega. 
                O percentual pode variar conforme acordado no seu cadastro. 
                O valor restante após o desconto da comissão é o que você recebe por cada entrega.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}