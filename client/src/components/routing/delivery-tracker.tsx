import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, Clock, DollarSign, Route, RefreshCw, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';

interface DeliveryTrackerProps {
  deliveryId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onStatusUpdate?: (status: string) => void;
}

export default function DeliveryTracker({
  deliveryId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 segundos
  onStatusUpdate
}: DeliveryTrackerProps) {
  const { toast } = useToast();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="h-5 w-5 text-yellow-600" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_transit':
        return 'Em Trânsito';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchTrackingData = async () => {
    if (!deliveryId) return;

    setIsLoading(true);
    
    try {
      const result = await apiRequest(`/api/routing/delivery-tracking/${deliveryId}`, 'GET');
      setTrackingData(result);
      setLastUpdate(new Date());
      
      if (onStatusUpdate && result.delivery?.status) {
        onStatusUpdate(result.delivery.status);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível obter dados de rastreamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [deliveryId]);

  useEffect(() => {
    if (autoRefresh && deliveryId) {
      const interval = setInterval(fetchTrackingData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, deliveryId, refreshInterval]);

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

  if (!trackingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Rastreamento da Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {isLoading ? "Carregando dados..." : "Dados de rastreamento não disponíveis"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { delivery, tracking } = trackingData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Rastreamento da Entrega #{delivery.id}
        </CardTitle>
        <CardDescription>
          Status atual e informações da rota
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Atual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(delivery.status)}
            <span className="font-medium">Status:</span>
          </div>
          <Badge className={getStatusColor(delivery.status)}>
            {getStatusText(delivery.status)}
          </Badge>
        </div>

        {/* Progresso */}
        {tracking.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso da Entrega</span>
              <span>{tracking.progress}%</span>
            </div>
            <Progress value={tracking.progress} className="h-2" />
          </div>
        )}

        {/* Informações da Rota */}
        {tracking.route && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-blue-50 p-3 rounded-lg">
                <Route className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-sm text-gray-600">Distância</p>
                <p className="font-bold text-blue-600">
                  {tracking.pricing.distanceKm} km
                </p>
              </div>
              
              <div className="text-center bg-orange-50 p-3 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-sm text-gray-600">Tempo</p>
                <p className="font-bold text-orange-600">
                  {formatDuration(Math.round(tracking.route.duration / 60))}
                </p>
              </div>
              
              <div className="text-center bg-green-50 p-3 rounded-lg">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-sm text-gray-600">Valor</p>
                <p className="font-bold text-green-600">
                  {formatCurrency(tracking.pricing.totalFare)}
                </p>
              </div>
            </div>

            {/* ETA */}
            {tracking.eta && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Tempo Estimado</span>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {formatDuration(tracking.eta)}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Para chegada ao destino
                </p>
              </div>
            )}
          </>
        )}

        {/* Informações da Entrega */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Detalhes da Entrega</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span>{delivery.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span>{delivery.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Endereço:</span>
              <span className="text-right">{delivery.deliveryAddress}</span>
            </div>
            {delivery.notes && (
              <div className="flex justify-between">
                <span className="text-gray-600">Observações:</span>
                <span className="text-right">{delivery.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Atualização e Controles */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            {lastUpdate ? (
              <span>Atualizado: {lastUpdate.toLocaleTimeString()}</span>
            ) : (
              <span>Nunca atualizado</span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrackingData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </>
            )}
          </Button>
        </div>

        {/* Mensagem de Erro */}
        {tracking.message && !tracking.route && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900">Aviso</span>
            </div>
            <p className="text-sm text-yellow-800">{tracking.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}