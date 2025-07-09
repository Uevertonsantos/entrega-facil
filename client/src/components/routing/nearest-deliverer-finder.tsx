import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Navigation, Clock, Users, Loader2 } from 'lucide-react';

interface DelivererLocation {
  id: number;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface NearestDelivererFinderProps {
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  delivererLocations: DelivererLocation[];
  onDelivererSelected?: (deliverer: any) => void;
}

export default function NearestDelivererFinder({
  pickupLocation,
  delivererLocations,
  onDelivererSelected
}: NearestDelivererFinderProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [nearestDeliverer, setNearestDeliverer] = useState<any>(null);

  const findNearestDeliverer = async () => {
    if (!pickupLocation || !delivererLocations.length) {
      toast({
        title: "Erro",
        description: "Local de coleta e entregadores são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await apiRequest('/api/routing/find-nearest-deliverer', 'POST', {
        pickupLocation,
        delivererLocations
      });
      
      setNearestDeliverer(result);
      
      if (onDelivererSelected) {
        onDelivererSelected(result);
      }
      
      toast({
        title: "Entregador encontrado!",
        description: `${result.deliverer.name} está a ${result.distance.toFixed(2)}km de distância.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível encontrar o entregador mais próximo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Encontrar Entregador Mais Próximo
        </CardTitle>
        <CardDescription>
          Encontre o entregador mais próximo do local de coleta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Local de Coleta:</span>
          </div>
          <Badge variant="outline">
            {pickupLocation.latitude.toFixed(6)}, {pickupLocation.longitude.toFixed(6)}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm">Entregadores Disponíveis:</span>
          </div>
          <Badge variant="secondary">
            {delivererLocations.length} entregadores
          </Badge>
        </div>

        <Button 
          onClick={findNearestDeliverer} 
          disabled={isLoading || !delivererLocations.length}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procurando...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Encontrar Entregador Mais Próximo
            </>
          )}
        </Button>

        {nearestDeliverer && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Entregador Mais Próximo</h3>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-900">
                  {nearestDeliverer.deliverer.name}
                </h4>
                <Badge className="bg-green-100 text-green-800">
                  Mais Próximo
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Distância:</span>
                  </div>
                  <p className="font-semibold">
                    {formatDistance(nearestDeliverer.distance)}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Tempo:</span>
                  </div>
                  <p className="font-semibold">
                    {formatDuration(nearestDeliverer.eta)}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-600">
                <p>
                  Localização: {nearestDeliverer.deliverer.location.latitude.toFixed(6)}, {nearestDeliverer.deliverer.location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {delivererLocations.length === 0 && (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Nenhum entregador disponível no momento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}