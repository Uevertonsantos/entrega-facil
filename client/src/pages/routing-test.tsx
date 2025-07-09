import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Clock, DollarSign, Route, Navigation } from 'lucide-react';

interface RouteResult {
  route: {
    distance: number;
    duration: number;
    geometry: Array<[number, number]>;
  };
  pricing: {
    distanceKm: number;
    baseFare: number;
    distanceFare: number;
    totalFare: number;
  };
  eta: number;
  summary: {
    distanceKm: number;
    durationMinutes: number;
    totalFare: number;
    etaMinutes: number;
  };
}

export default function RoutingTest() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [pickupLocation, setPickupLocation] = useState({
    latitude: -7.119, // Conde, PB
    longitude: -34.908
  });
  const [deliveryLocation, setDeliveryLocation] = useState({
    latitude: -7.115, // Outro ponto em Conde
    longitude: -34.905
  });
  const [baseFare, setBaseFare] = useState(5.00);
  const [farePerKm, setFarePerKm] = useState(2.50);

  const calculateRoute = async () => {
    if (!pickupLocation.latitude || !pickupLocation.longitude || 
        !deliveryLocation.latitude || !deliveryLocation.longitude) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todas as coordenadas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await apiRequest('/api/routing/calculate-delivery', 'POST', {
        pickupLocation,
        deliveryLocation,
        baseFare,
        farePerKm
      });
      
      setRouteResult(result);
      
      toast({
        title: "Rota calculada!",
        description: `Distância: ${result.summary.distanceKm}km - Valor: R$ ${result.summary.totalFare}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível calcular a rota.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teste de Roteamento</h1>
        <p className="text-gray-600">
          Teste o sistema de cálculo de rotas e preços usando OpenRouteService
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Entrada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configuração da Rota
            </CardTitle>
            <CardDescription>
              Insira as coordenadas de origem e destino
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-blue-700 mb-2">Local de Coleta</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pickup-lat">Latitude</Label>
                    <Input
                      id="pickup-lat"
                      type="number"
                      step="0.000001"
                      value={pickupLocation.latitude}
                      onChange={(e) => setPickupLocation(prev => ({
                        ...prev,
                        latitude: parseFloat(e.target.value)
                      }))}
                      placeholder="-7.119"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup-lng">Longitude</Label>
                    <Input
                      id="pickup-lng"
                      type="number"
                      step="0.000001"
                      value={pickupLocation.longitude}
                      onChange={(e) => setPickupLocation(prev => ({
                        ...prev,
                        longitude: parseFloat(e.target.value)
                      }))}
                      placeholder="-34.908"
                    />
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-green-700 mb-2">Local de Entrega</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="delivery-lat">Latitude</Label>
                    <Input
                      id="delivery-lat"
                      type="number"
                      step="0.000001"
                      value={deliveryLocation.latitude}
                      onChange={(e) => setDeliveryLocation(prev => ({
                        ...prev,
                        latitude: parseFloat(e.target.value)
                      }))}
                      placeholder="-7.115"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery-lng">Longitude</Label>
                    <Input
                      id="delivery-lng"
                      type="number"
                      step="0.000001"
                      value={deliveryLocation.longitude}
                      onChange={(e) => setDeliveryLocation(prev => ({
                        ...prev,
                        longitude: parseFloat(e.target.value)
                      }))}
                      placeholder="-34.905"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Configuração de Preços
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="base-fare">Taxa Base (R$)</Label>
                  <Input
                    id="base-fare"
                    type="number"
                    step="0.01"
                    value={baseFare}
                    onChange={(e) => setBaseFare(parseFloat(e.target.value))}
                    placeholder="5.00"
                  />
                </div>
                <div>
                  <Label htmlFor="fare-per-km">R$ por km</Label>
                  <Input
                    id="fare-per-km"
                    type="number"
                    step="0.01"
                    value={farePerKm}
                    onChange={(e) => setFarePerKm(parseFloat(e.target.value))}
                    placeholder="2.50"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={calculateRoute} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Calculando...
                </>
              ) : (
                <>
                  <Route className="h-4 w-4 mr-2" />
                  Calcular Rota
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Resultados da Rota
            </CardTitle>
            <CardDescription>
              Informações detalhadas da rota calculada
            </CardDescription>
          </CardHeader>
          <CardContent>
            {routeResult ? (
              <div className="space-y-6">
                {/* Resumo Principal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Distância</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {routeResult.summary.distanceKm} km
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Duração</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatDuration(routeResult.summary.durationMinutes)}
                    </p>
                  </div>
                </div>

                {/* Detalhes de Preço */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cálculo de Preço
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa Base:</span>
                      <span>{formatCurrency(routeResult.pricing.baseFare)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa por Distância:</span>
                      <span>{formatCurrency(routeResult.pricing.distanceFare)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>({routeResult.pricing.distanceKm} km × R$ {farePerKm})</span>
                      <span></span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {formatCurrency(routeResult.pricing.totalFare)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tempo Estimado */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-900">Tempo Estimado</span>
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {formatDuration(routeResult.eta)}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Baseado em velocidade média de 30 km/h
                  </p>
                </div>

                {/* Informações Técnicas */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Informações Técnicas</h3>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>Distância exata: {routeResult.route.distance}m</p>
                    <p>Duração exata: {routeResult.route.duration}s</p>
                    <p>Pontos da rota: {routeResult.route.geometry.length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Clique em "Calcular Rota" para ver os resultados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aviso sobre API Key */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-orange-600">⚠️ Configuração Necessária</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            Para usar o sistema de roteamento, você precisa configurar uma chave API do OpenRouteService:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Acesse <a href="https://openrouteservice.org" target="_blank" rel="noopener" className="text-blue-600 hover:underline">openrouteservice.org</a></li>
            <li>Crie uma conta gratuita</li>
            <li>Obtenha sua chave API (2.000 requisições/dia grátis)</li>
            <li>Configure a variável de ambiente <code className="bg-gray-100 px-1 rounded">OPENROUTESERVICE_API_KEY</code></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}