import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Settings, 
  DollarSign, 
  Route, 
  MapPin, 
  CreditCard,
  Save,
  RotateCcw 
} from "lucide-react";

interface AdminSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest(`/api/admin/settings/${key}`, "PUT", { value });
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Configuração atualizada",
        description: `A configuração "${key}" foi atualizada com sucesso.`,
      });
      // Remove from pending changes
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[key];
        return newChanges;
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
          window.location.href = "/admin-login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = (key: string) => {
    const value = pendingChanges[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value });
    }
  };

  const handleReset = (key: string) => {
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[key];
      return newChanges;
    });
  };

  const getSettingValue = (key: string) => {
    return pendingChanges[key] ?? settings?.find(s => s.settingKey === key)?.settingValue ?? "";
  };

  const hasPendingChanges = (key: string) => {
    return pendingChanges[key] !== undefined;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
        <div className="grid gap-6">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Configure as taxas de entrega e planos de assinatura</p>
        </div>
        <Settings className="h-8 w-8 text-primary" />
      </div>

      <Tabs defaultValue="delivery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="delivery">Entregas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="location">Localização</TabsTrigger>
        </TabsList>

        {/* Delivery Settings */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5" />
                <span>Configurações de Entrega</span>
              </CardTitle>
              <CardDescription>
                Configure as taxas de entrega e parâmetros de cálculo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Fee */}
                <div className="space-y-2">
                  <Label htmlFor="delivery_base_fee">Taxa Base (R$)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="delivery_base_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={getSettingValue("delivery_base_fee")}
                      onChange={(e) => handleInputChange("delivery_base_fee", e.target.value)}
                      placeholder="5.00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("delivery_base_fee")}
                      disabled={!hasPendingChanges("delivery_base_fee") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("delivery_base_fee")}
                      disabled={!hasPendingChanges("delivery_base_fee")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Taxa fixa aplicada a todas as entregas</p>
                </div>

                {/* Per KM Rate */}
                <div className="space-y-2">
                  <Label htmlFor="delivery_per_km_rate">Taxa por KM (R$)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="delivery_per_km_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={getSettingValue("delivery_per_km_rate")}
                      onChange={(e) => handleInputChange("delivery_per_km_rate", e.target.value)}
                      placeholder="2.50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("delivery_per_km_rate")}
                      disabled={!hasPendingChanges("delivery_per_km_rate") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("delivery_per_km_rate")}
                      disabled={!hasPendingChanges("delivery_per_km_rate")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Valor cobrado por quilômetro percorrido</p>
                </div>

                {/* Minimum Fee */}
                <div className="space-y-2">
                  <Label htmlFor="delivery_minimum_fee">Taxa Mínima (R$)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="delivery_minimum_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={getSettingValue("delivery_minimum_fee")}
                      onChange={(e) => handleInputChange("delivery_minimum_fee", e.target.value)}
                      placeholder="7.00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("delivery_minimum_fee")}
                      disabled={!hasPendingChanges("delivery_minimum_fee") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("delivery_minimum_fee")}
                      disabled={!hasPendingChanges("delivery_minimum_fee")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Valor mínimo cobrado por entrega</p>
                </div>

                {/* Maximum Fee */}
                <div className="space-y-2">
                  <Label htmlFor="delivery_maximum_fee">Taxa Máxima (R$)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="delivery_maximum_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={getSettingValue("delivery_maximum_fee")}
                      onChange={(e) => handleInputChange("delivery_maximum_fee", e.target.value)}
                      placeholder="25.00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("delivery_maximum_fee")}
                      disabled={!hasPendingChanges("delivery_maximum_fee") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("delivery_maximum_fee")}
                      disabled={!hasPendingChanges("delivery_maximum_fee")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Valor máximo cobrado por entrega</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Settings */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Planos de Assinatura</span>
              </CardTitle>
              <CardDescription>
                Configure os valores dos planos oferecidos aos comerciantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Plan */}
                <div className="space-y-2">
                  <Label htmlFor="plan_monthly_price">Plano Mensal (R$)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="plan_monthly_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={getSettingValue("plan_monthly_price")}
                      onChange={(e) => handleInputChange("plan_monthly_price", e.target.value)}
                      placeholder="149.00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("plan_monthly_price")}
                      disabled={!hasPendingChanges("plan_monthly_price") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("plan_monthly_price")}
                      disabled={!hasPendingChanges("plan_monthly_price")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Valor da assinatura mensal</p>
                </div>

                {/* Per Delivery Plan */}
                <div className="space-y-2">
                  <Label htmlFor="plan_per_delivery_price">Por Entrega (R$)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="plan_per_delivery_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={getSettingValue("plan_per_delivery_price")}
                      onChange={(e) => handleInputChange("plan_per_delivery_price", e.target.value)}
                      placeholder="10.00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("plan_per_delivery_price")}
                      disabled={!hasPendingChanges("plan_per_delivery_price") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("plan_per_delivery_price")}
                      disabled={!hasPendingChanges("plan_per_delivery_price")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Valor cobrado por entrega avulsa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Settings */}
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Configurações de Localização</span>
              </CardTitle>
              <CardDescription>
                Configure a cidade e estado padrão para geocodificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default City */}
                <div className="space-y-2">
                  <Label htmlFor="default_city">Cidade Padrão</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="default_city"
                      type="text"
                      value={getSettingValue("default_city")}
                      onChange={(e) => handleInputChange("default_city", e.target.value)}
                      placeholder="Salvador"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("default_city")}
                      disabled={!hasPendingChanges("default_city") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("default_city")}
                      disabled={!hasPendingChanges("default_city")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Cidade usada quando não especificada no endereço</p>
                </div>

                {/* Default State */}
                <div className="space-y-2">
                  <Label htmlFor="default_state">Estado Padrão</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="default_state"
                      type="text"
                      value={getSettingValue("default_state")}
                      onChange={(e) => handleInputChange("default_state", e.target.value)}
                      placeholder="BA"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave("default_state")}
                      disabled={!hasPendingChanges("default_state") || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset("default_state")}
                      disabled={!hasPendingChanges("default_state")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Estado usado quando não especificado no endereço</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}