import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Monitor, 
  Building2, 
  Users, 
  Package, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Search,
  Phone,
  MapPin,
  DollarSign,
  AlertTriangle,
  Eye,
  Ban,
  UserCheck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ClientInstallation {
  id: number;
  installationId: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  lastSync: string;
  createdAt: string;
}

interface ClientCustomer {
  id: number;
  installationId: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

interface ClientDelivery {
  id: number;
  installationId: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  price: string;
  deliveryFee: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function ClientsMonitoring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstallation, setSelectedInstallation] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch installations
  const { data: installations = [], isLoading: installationsLoading } = useQuery({
    queryKey: ['/api/admin/client-installations'],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  // Fetch customers for selected installation
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/admin/client-customers', selectedInstallation],
    enabled: !!selectedInstallation,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch deliveries for selected installation
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/admin/client-deliveries', selectedInstallation],
    enabled: !!selectedInstallation,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const formatTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
  };

  const getStatusBadge = (lastSync: string) => {
    const now = new Date();
    const syncDate = new Date(lastSync);
    const diffInMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 30) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Online</Badge>;
    } else if (diffInMinutes < 120) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Offline</Badge>;
    }
  };

  const calculateRevenue = (deliveries: ClientDelivery[]) => {
    return deliveries.reduce((sum, delivery) => {
      return sum + parseFloat(delivery.deliveryFee || '0');
    }, 0);
  };

  const getPaymentMethodStats = (deliveries: ClientDelivery[]) => {
    const stats = deliveries.reduce((acc, delivery) => {
      const method = delivery.paymentMethod || 'dinheiro';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return stats;
  };

  const filteredInstallations = installations.filter((installation: ClientInstallation) =>
    installation.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installation.businessEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (installationsLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Monitor de Clientes</h1>
          <p className="text-gray-600 mt-1">Monitoramento em tempo real de clientes e sistema de entregas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh">Atualização Automática</Label>
            <input
              id="auto-refresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou email do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold">{installations.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {installations.filter((inst: ClientInstallation) => {
                    const diffInMinutes = Math.floor((new Date().getTime() - new Date(inst.lastSync).getTime()) / (1000 * 60));
                    return diffInMinutes < 30;
                  }).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {installations.filter((inst: ClientInstallation) => {
                    const diffInMinutes = Math.floor((new Date().getTime() - new Date(inst.lastSync).getTime()) / (1000 * 60));
                    return diffInMinutes > 120;
                  }).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {deliveries.reduce((sum, d) => sum + parseFloat(d.deliveryFee || '0'), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Clientes Instalados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInstallations.map((installation: ClientInstallation) => (
              <div
                key={installation.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedInstallation === installation.installationId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedInstallation(installation.installationId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{installation.businessName}</h3>
                      {getStatusBadge(installation.lastSync)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {installation.businessPhone}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {installation.businessAddress}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Última sincronização</p>
                    <p className="font-medium">{formatTimeSince(installation.lastSync)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Details */}
      {selectedInstallation && (
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Clientes ({customers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers.map((customer: ClientCustomer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                        <p className="text-sm text-gray-500">{customer.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Cliente desde</p>
                        <p className="text-sm font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Entregas ({deliveries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveries.map((delivery: ClientDelivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{delivery.customerName}</h4>
                        <p className="text-sm text-gray-600">{delivery.customerPhone}</p>
                        <p className="text-sm text-gray-500">{delivery.deliveryAddress}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">R$ {delivery.price}</p>
                        <p className="text-sm text-gray-600">Taxa: R$ {delivery.deliveryFee}</p>
                        <Badge variant={delivery.status === 'completed' ? 'default' : 'secondary'}>
                          {delivery.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {calculateRevenue(deliveries).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {deliveries.length} entregas realizadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(getPaymentMethodStats(deliveries)).map(([method, count]) => (
                      <div key={method} className="flex justify-between">
                        <span className="capitalize">{method}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}