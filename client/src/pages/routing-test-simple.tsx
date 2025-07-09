import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function RoutingTestSimple() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [farePerKm, setFarePerKm] = useState('2.50');
  const [result, setResult] = useState<any>(null);

  // Load cities
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await apiRequest('/api/cities', 'GET');
      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadNeighborhoods = async (cityName: string) => {
    try {
      const data = await apiRequest(`/api/neighborhoods/city/${cityName}`, 'GET');
      setNeighborhoods(data);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    }
  };

  const testRouting = async () => {
    if (!selectedCity || !selectedNeighborhood) {
      toast({
        title: "Erro",
        description: "Selecione uma cidade e um bairro primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const testResult = await apiRequest('/api/routing/calculate-delivery', 'POST', {
        neighborhoodName: selectedNeighborhood,
        cityName: selectedCity,
        farePerKm: parseFloat(farePerKm)
      });
      
      setResult(testResult);
      
      toast({
        title: "Teste concluído!",
        description: `Cidade: ${selectedCity}, Bairro: ${selectedNeighborhood} - Valor: R$ ${testResult.summary.totalFare.toFixed(2)}`,
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
          <CardTitle>Teste de Cálculo por Bairro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Select value={selectedCity} onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedNeighborhood('');
                loadNeighborhoods(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.city} value={city.city}>
                      {city.city} - {city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro de Destino</Label>
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood} disabled={!selectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um bairro" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.name}>
                      {neighborhood.name} - Distância: {neighborhood.averageDistance}km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="farePerKm">Valor por Km (R$)</Label>
              <Input
                id="farePerKm"
                type="number"
                step="0.01"
                value={farePerKm}
                onChange={(e) => setFarePerKm(e.target.value)}
                placeholder="2.50"
              />
            </div>

            <Button 
              onClick={testRouting} 
              disabled={isLoading || !selectedNeighborhood}
              className="w-full"
            >
              {isLoading ? "Calculando..." : "Calcular Valor da Entrega"}
            </Button>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                <p><strong>Bairro:</strong> {result.neighborhood.neighborhoodName}</p>
                <p><strong>Cidade:</strong> {result.neighborhood.city}</p>
                <p><strong>Distância Média:</strong> {result.summary.distanceKm}km</p>
                <p><strong>Tempo Estimado:</strong> {result.summary.durationMinutes} min</p>
                <p><strong>Tarifa Base:</strong> R$ {result.neighborhood.baseFare.toFixed(2)}</p>
                <p><strong>Valor Total:</strong> R$ {result.summary.totalFare.toFixed(2)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}