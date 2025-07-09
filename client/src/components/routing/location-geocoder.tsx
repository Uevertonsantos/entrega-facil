import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Search, Copy, Loader2 } from 'lucide-react';

interface LocationGeocoderProps {
  onAddressFound?: (address: string, coordinates: { latitude: number; longitude: number }) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export default function LocationGeocoder({
  onAddressFound,
  initialLatitude = -7.119,
  initialLongitude = -34.908
}: LocationGeocoderProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude
  });
  const [address, setAddress] = useState<string>('');

  const reverseGeocode = async () => {
    if (!coordinates.latitude || !coordinates.longitude) {
      toast({
        title: "Erro",
        description: "Por favor, insira coordenadas válidas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await apiRequest('/api/routing/reverse-geocode', 'POST', {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
      
      setAddress(result.address);
      
      if (onAddressFound) {
        onAddressFound(result.address, coordinates);
      }
      
      toast({
        title: "Endereço encontrado!",
        description: "Localização convertida em endereço com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível converter as coordenadas em endereço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast({
            title: "Localização obtida!",
            description: "Sua localização atual foi detectada.",
          });
        },
        (error) => {
          toast({
            title: "Erro",
            description: "Não foi possível obter sua localização atual.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada pelo seu navegador.",
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Copiado!",
        description: "Endereço copiado para a área de transferência.",
      });
    }
  };

  const copyCoordinates = () => {
    const coordText = `${coordinates.latitude}, ${coordinates.longitude}`;
    navigator.clipboard.writeText(coordText);
    toast({
      title: "Copiado!",
      description: "Coordenadas copiadas para a área de transferência.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geocodificação Reversa
        </CardTitle>
        <CardDescription>
          Converta coordenadas em endereços legíveis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coordenadas */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={coordinates.latitude}
                onChange={(e) => setCoordinates(prev => ({
                  ...prev,
                  latitude: parseFloat(e.target.value)
                }))}
                placeholder="-7.119"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={coordinates.longitude}
                onChange={(e) => setCoordinates(prev => ({
                  ...prev,
                  longitude: parseFloat(e.target.value)
                }))}
                placeholder="-34.908"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={getCurrentLocation}
              variant="outline"
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Minha Localização
            </Button>
            
            <Button 
              onClick={copyCoordinates}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Botão de Pesquisa */}
        <Button 
          onClick={reverseGeocode} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Convertendo...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Converter em Endereço
            </>
          )}
        </Button>

        {/* Resultado */}
        {address && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Endereço Encontrado</h3>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-green-900 font-medium mb-1">
                    {address}
                  </p>
                  <p className="text-sm text-green-700">
                    {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dica de Uso */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dica de Uso</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Clique em "Minha Localização" para usar sua posição atual</li>
            <li>• Use o botão de cópia para copiar coordenadas ou endereços</li>
            <li>• Coordenadas devem estar no formato decimal (ex: -7.119, -34.908)</li>
            <li>• Funciona melhor com localizações em áreas urbanas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}