import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Building2, 
  Users, 
  Package, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Settings,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ClientData {
  id: string;
  businessName: string;
  businessEmail: string;
  lastSync: string;
  status: 'active' | 'inactive' | 'error';
  totalMerchants: number;
  totalDeliverers: number;
  totalDeliveries: number;
  version?: string;
  location?: string;
  installDate?: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalSyncedMerchants: number;
  totalSyncedDeliverers: number;
  totalSyncedDeliveries: number;
  lastSyncTime: string;
}

export default function ClientsOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery<ClientData[]>({
    queryKey: ['/api/admin/clients'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery<ClientStats>({
    queryKey: ['/api/admin/clients/stats'],
    queryFn: async () => {
      // Mock stats for now
      return {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        totalSyncedMerchants: clients.reduce((sum, c) => sum + c.totalMerchants, 0),
        totalSyncedDeliverers: clients.reduce((sum, c) => sum + c.totalDeliverers, 0),
        totalSyncedDeliveries: clients.reduce((sum, c) => sum + c.totalDeliveries, 0),
        lastSyncTime: new Date().toISOString()
      };
    },
  });

  const forceSync = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest(`/api/admin/clients/${clientId}/sync`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Sincronização iniciada",
        description: "A sincronização foi solicitada para o cliente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes Instalados</h1>
          <p className="text-gray-600 mt-1">Gerencie sistemas instalados localmente e monitor sincronização</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Baixar Instalador
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
              </div>
              <Monitor className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats?.activeClients || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comerciantes</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.totalSyncedMerchants || 0}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entregadores</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.totalSyncedDeliverers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entregas</p>
                <p className="text-2xl font-bold text-indigo-600">{stats?.totalSyncedDeliveries || 0}</p>
              </div>
              <Package className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Clientes Instalados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente instalado</h3>
              <p className="text-gray-500 mb-4">Quando clientes instalarem o sistema, aparecerão aqui</p>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Baixar Instalador
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Última Sincronização</th>
                    <th className="text-left p-3">Dados</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">{client.businessName}</p>
                          <p className="text-sm text-gray-500">{client.businessEmail}</p>
                          <p className="text-xs text-gray-400 mt-1">ID: {client.id}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm text-gray-900">{formatDate(client.lastSync)}</p>
                          <p className="text-xs text-gray-500">{formatTimeSince(client.lastSync)}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-purple-500" />
                            {client.totalMerchants}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-orange-500" />
                            {client.totalDeliverers}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-indigo-500" />
                            {client.totalDeliveries}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => forceSync.mutate(client.id)}
                            disabled={forceSync.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Sincronizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClient(client.id)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Configurar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Atividade de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Sincronização automática ativa</p>
                  <p className="text-sm text-green-600">Última sincronização: {formatTimeSince(stats?.lastSyncTime || new Date().toISOString())}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Sincronização automática a cada 15 minutos</p>
              <p>• Dados são enviados apenas quando há alterações</p>
              <p>• Clientes mantêm dados locais para performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}