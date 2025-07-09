import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  DollarSign, 
  Store, 
  AlertCircle, 
  CheckCircle, 
  Receipt, 
  CreditCard,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import type { Merchant, DeliveryWithRelations } from "@shared/schema";

export default function MerchantPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payments, setPayments] = useState<{[key: number]: string}>({});

  const { data: merchants, isLoading: merchantsLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
    retry: false,
  });

  const { data: deliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithRelations[]>({
    queryKey: ["/api/deliveries"],
    retry: false,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: { merchantId: number; amount: number }) => {
      return await apiRequest("/api/merchants/record-payment", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso",
      });
      setPayments({});
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completedDeliveries = deliveries?.filter(d => d.status === "completed") || [];

  // Calcular valores devidos por comerciante
  const merchantDebts = merchants?.map(merchant => {
    const merchantDeliveries = completedDeliveries.filter(d => d.merchantId === merchant.id);
    const totalDeliveryFees = merchantDeliveries.reduce((sum, d) => sum + (parseFloat(d.deliveryFee?.toString() || "0")), 0);
    const totalOwed = parseFloat(merchant.totalOwed?.toString() || "0");
    const currentBalance = parseFloat(merchant.currentBalance?.toString() || "0");
    
    return {
      merchant,
      deliveryCount: merchantDeliveries.length,
      totalDeliveryFees,
      totalOwed,
      currentBalance,
      status: currentBalance < 0 ? "debt" : currentBalance > 0 ? "credit" : "neutral"
    };
  }).sort((a, b) => b.totalOwed - a.totalOwed) || [];

  const totalDebt = merchantDebts.reduce((sum, md) => sum + (md.currentBalance < 0 ? Math.abs(md.currentBalance) : 0), 0);
  const totalCredit = merchantDebts.reduce((sum, md) => sum + (md.currentBalance > 0 ? md.currentBalance : 0), 0);

  const handleRecordPayment = (merchantId: number) => {
    const amount = parseFloat(payments[merchantId] || "0");
    if (amount <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }
    recordPaymentMutation.mutate({ merchantId, amount });
  };

  if (merchantsLoading || deliveriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pagamentos dos Comerciantes</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pagamentos dos Comerciantes</h1>
        <div className="text-sm text-gray-500">
          Controle de recebimentos das taxas de entrega
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 mr-1" />
              Total em Débito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-600">
                R$ {totalDebt.toFixed(2)}
              </span>
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Total em Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">
                R$ {totalCredit.toFixed(2)}
              </span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Pago
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${totalCredit - totalDebt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {(totalCredit - totalDebt).toFixed(2)}
              </span>
              <Badge className={totalCredit - totalDebt >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {totalCredit - totalDebt >= 0 ? "Positivo" : "Negativo"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merchant Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Pagamentos por Comerciante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Comerciante</th>
                  <th className="text-left py-3 px-4">Entregas</th>
                  <th className="text-left py-3 px-4">Taxa Total</th>
                  <th className="text-left py-3 px-4">Saldo Atual</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Registrar Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {merchantDebts.map(({ merchant, deliveryCount, totalDeliveryFees, currentBalance, status }) => (
                  <tr key={merchant.id} className="border-b">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                          <Store className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{merchant.name}</p>
                          <p className="text-sm text-gray-500">{merchant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {deliveryCount} entregas
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-blue-600">
                      R$ {totalDeliveryFees.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium">
                      <span className={currentBalance < 0 ? "text-red-600" : currentBalance > 0 ? "text-green-600" : "text-gray-900"}>
                        R$ {currentBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={
                        status === "debt" ? "bg-red-100 text-red-800" :
                        status === "credit" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }>
                        {status === "debt" ? "Devendo" : status === "credit" ? "Crédito" : "Neutro"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={payments[merchant.id] || ""}
                          onChange={(e) => setPayments(prev => ({...prev, [merchant.id]: e.target.value}))}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRecordPayment(merchant.id)}
                          disabled={!payments[merchant.id] || recordPaymentMutation.isPending}
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Registrar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {merchantDebts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum comerciante encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}