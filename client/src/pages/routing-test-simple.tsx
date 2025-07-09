import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function RoutingTestSimple() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testRouting = async () => {
    setIsLoading(true);
    
    try {
      const testResult = await apiRequest('/api/routing/calculate-delivery', 'POST', {
        pickupLocation: {
          latitude: -7.119,
          longitude: -34.908
        },
        deliveryLocation: {
          latitude: -7.115,
          longitude: -34.905
        },
        baseFare: 5.00,
        farePerKm: 2.50
      });
      
      setResult(testResult);
      
      toast({
        title: "Teste concluído!",
        description: `Distância: ${testResult.summary.distanceKm}km`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro no teste",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Roteamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testRouting} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Testando..." : "Testar Sistema de Routing"}
            </Button>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                <p>Distância: {result.summary.distanceKm}km</p>
                <p>Duração: {result.summary.durationMinutes} min</p>
                <p>Valor: R$ {result.summary.totalFare.toFixed(2)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}