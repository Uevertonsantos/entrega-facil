import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Clock, Trash2, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RealTimeMonitor() {
  const { isConnected, messages, sendMessage } = useWebSocket();
  const [filter, setFilter] = useState<string>('all');
  const [deliveryMessages, setDeliveryMessages] = useState<any[]>([]);

  useEffect(() => {
    // Filter messages related to deliveries
    const filtered = messages.filter(msg => 
      msg.type.includes('delivery') || 
      msg.type.includes('client_') ||
      msg.type === 'new_delivery' ||
      msg.type === 'delivery_accepted' ||
      msg.type === 'delivery_completed'
    );
    setDeliveryMessages(filtered);
  }, [messages]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'new_delivery':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'delivery_accepted':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'delivery_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'client_delivery_sync':
        return <Wifi className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMessageTitle = (type: string) => {
    switch (type) {
      case 'new_delivery':
        return 'Nova Entrega';
      case 'delivery_accepted':
        return 'Entrega Aceita';
      case 'delivery_completed':
        return 'Entrega Concluída';
      case 'client_delivery_sync':
        return 'Sincronização de Cliente';
      case 'delivery_update':
        return 'Atualização de Entrega';
      default:
        return 'Notificação';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'new_delivery':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivery_accepted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'delivery_completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'client_delivery_sync':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const clearMessages = () => {
    setDeliveryMessages([]);
  };

  const testConnection = () => {
    sendMessage({ type: 'ping' });
  };

  const filteredMessages = deliveryMessages.filter(msg => {
    if (filter === 'all') return true;
    return msg.type === filter;
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Monitor de Entregas em Tempo Real
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Desconectado</span>
                </div>
              )}
            </div>
            <Button onClick={testConnection} variant="outline" size="sm">
              Testar Conexão
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Novas Entregas
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {deliveryMessages.filter(m => m.type === 'new_delivery').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Aceitas
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {deliveryMessages.filter(m => m.type === 'delivery_accepted').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Concluídas
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {deliveryMessages.filter(m => m.type === 'delivery_completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Sincronizações
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {deliveryMessages.filter(m => m.type === 'client_delivery_sync').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notificações Recentes</CardTitle>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  <option value="all">Todas</option>
                  <option value="new_delivery">Novas Entregas</option>
                  <option value="delivery_accepted">Aceitas</option>
                  <option value="delivery_completed">Concluídas</option>
                  <option value="client_delivery_sync">Sincronizações</option>
                </select>
                <Button 
                  onClick={clearMessages} 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma notificação recente
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.reverse().map((message, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      {getMessageIcon(message.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getMessageTitle(message.type)}
                          </span>
                          <Badge
                            variant="secondary"
                            className={getMessageColor(message.type)}
                          >
                            {message.type}
                          </Badge>
                        </div>
                        {message.payload && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {message.payload.delivery && (
                              <div>
                                <p><strong>Cliente:</strong> {message.payload.delivery.customerName}</p>
                                <p><strong>Endereço:</strong> {message.payload.delivery.deliveryAddress}</p>
                                <p><strong>Status:</strong> {message.payload.delivery.status}</p>
                                {message.payload.clientId && (
                                  <p><strong>Cliente ID:</strong> {message.payload.clientId}</p>
                                )}
                              </div>
                            )}
                            {message.payload.action && (
                              <p><strong>Ação:</strong> {message.payload.action}</p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {message.timestamp && formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}