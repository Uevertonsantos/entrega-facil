import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Clock, DollarSign, Route, Calculator, Loader2 } from 'lucide-react';

interface DeliveryRouteCalculatorProps {
  onRouteCalculated?: (routeData: any) => void;
  defaultPickupLocation?: {
    latitude: number;
    longitude: number;
  };
  defaultDeliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  baseFare?: number;
  farePerKm?: number;
  showPriceOnly?: boolean;
  className?: string;
}

export default function DeliveryRouteCalculator({
  onRouteCalculated,
  defaultPickupLocation = { latitude: -7.119, longitude: -34.908 },
  defaultDeliveryLocation = { latitude: -7.115, longitude: -34.905 },
  baseFare = 5.00,
  farePerKm = 2.50,
  showPriceOnly = false,
  className = ""
}: DeliveryRouteCalculatorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);
  const [pickupLocation, setPickupLocation] = useState(defaultPickupLocation);
  const [deliveryLocation, setDeliveryLocation] = useState(defaultDeliveryLocation);
  const [priceConfig, setPriceConfig] = useState({
    baseFare,
    farePerKm
  });

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
        baseFare: priceConfig.baseFare,
        farePerKm: priceConfig.farePerKm
      });
      
      setRouteResult(result);
      
      if (onRouteCalculated) {
        onRouteCalculated(result);
      }
      
      toast({
        title: "Rota calculada!",
        description: `Distância: ${result.summary.distanceKm}km - Valor: R$ ${result.summary.totalFare.toFixed(2)}`,
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

  if (showPriceOnly && routeResult) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Rota Calculada</span>
          </div>
          <Badge variant="secondary">
            {routeResult.summary.distanceKm} km
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-gray-500" />
            <p className="text-sm text-gray-600">Tempo</p>
            <p className="font-semibold">{formatDuration(routeResult.summary.durationMinutes)}</p>
          </div>
          
          <div className="text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-sm text-gray-600">Valor</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(routeResult.summary.totalFare)}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setRouteResult(null)}
          className="w-full"
        >
          Recalcular Rota
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Rota
        </CardTitle>
        <CardDescription>
          Calcule a distância e o valor da entrega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Localizações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Local de Coleta
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.000001"
                value={pickupLocation.latitude}
                onChange={(e) => setPickupLocation(prev => ({
                  ...prev,
                  latitude: parseFloat(e.target.value)
                }))}
                placeholder="Latitude"
              />
              <Input
                type="number"
                step="0.000001"
                value={pickupLocation.longitude}
                onChange={(e) => setPickupLocation(prev => ({
                  ...prev,
                  longitude: parseFloat(e.target.value)
                }))}
                placeholder="Longitude"
              />
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Local de Entrega
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.000001"
                value={deliveryLocation.latitude}
                onChange={(e) => setDeliveryLocation(prev => ({
                  ...prev,
                  latitude: parseFloat(e.target.value)
                }))}
                placeholder="Latitude"
              />
              <Input
                type="number"
                step="0.000001"
                value={deliveryLocation.longitude}
                onChange={(e) => setDeliveryLocation(prev => ({
                  ...prev,
                  longitude: parseFloat(e.target.value)
                }))}
                placeholder="Longitude"
              />
            </div>
          </div>
        </div>

        {/* Configuração de Preços */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base-fare">Taxa Base (R$)</Label>
            <Input
              id="base-fare"
              type="number"
              step="0.01"
              value={priceConfig.baseFare}
              onChange={(e) => setPriceConfig(prev => ({
                ...prev,
                baseFare: parseFloat(e.target.value)
              }))}
              placeholder="5.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fare-per-km">R$ por km</Label>
            <Input
              id="fare-per-km"
              type="number"
              step="0.01"
              value={priceConfig.farePerKm}
              onChange={(e) => setPriceConfig(prev => ({
                ...prev,
                farePerKm: parseFloat(e.target.value)
              }))}
              placeholder="2.50"
            />
          </div>
        </div>

        {/* Botão de Calcular */}
        <Button 
          onClick={calculateRoute} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Route className="h-4 w-4 mr-2" />
              Calcular Rota
            </>
          )}
        </Button>

        {/* Resultados */}
        {routeResult && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Resultados da Rota</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-blue-50 p-3 rounded-lg">
                <Route className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-sm text-gray-600">Distância</p>
                <p className="font-bold text-blue-600">
                  {routeResult.summary.distanceKm} km
                </p>
              </div>
              
              <div className="text-center bg-orange-50 p-3 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-sm text-gray-600">Tempo</p>
                <p className="font-bold text-orange-600">
                  {formatDuration(routeResult.summary.durationMinutes)}
                </p>
              </div>
              
              <div className="text-center bg-green-50 p-3 rounded-lg">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-sm text-gray-600">Valor</p>
                <p className="font-bold text-green-600">
                  {formatCurrency(routeResult.summary.totalFare)}
                </p>
              </div>
            </div>

            {/* Detalhes do Cálculo */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Detalhes do Cálculo</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Taxa Base:</span>
                  <span>{formatCurrency(routeResult.pricing.baseFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa por Distância:</span>
                  <span>{formatCurrency(routeResult.pricing.distanceFare)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>({routeResult.pricing.distanceKm} km × R$ {priceConfig.farePerKm})</span>
                  <span></span>
                </div>
                <div className="border-t pt-1 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(routeResult.pricing.totalFare)}</span>
                </div>
              </div>
            </div>

            {/* ETA */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium mb-1">Tempo Estimado de Chegada</h4>
              <p className="text-lg font-bold text-blue-600">
                {formatDuration(routeResult.eta)}
              </p>
              <p className="text-xs text-gray-600">
                Baseado em velocidade média de 30 km/h
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}