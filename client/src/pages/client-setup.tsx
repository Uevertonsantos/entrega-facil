import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Download, 
  Globe, 
  Key, 
  Settings, 
  Check,
  Copy,
  ExternalLink,
  Package,
  Smartphone,
  CheckCircle,
  Truck,
  Infinity
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  deliveryLimit: number | null;
  features: string[];
  description: string;
  isActive: boolean;
  color: string;
}

interface ClientSetupData {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  contactPerson: string;
  planType: string;
  installationType: 'online' | 'local';
}

export default function ClientSetup() {
  const { toast } = useToast();
  const [setupData, setSetupData] = useState<ClientSetupData>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    contactPerson: '',
    planType: '',
    installationType: 'online'
  });

  // Query to fetch active plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/plans', 'GET');
      return (response as Plan[]).filter(plan => plan.isActive);
    },
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    installationId: string;
    apiKey: string;
    accessUrl: string;
  } | null>(null);

  const setupMutation = useMutation({
    mutationFn: async (data: ClientSetupData) => {
      const response = await apiRequest('/api/admin/setup-client', 'POST', data);
      return response;
    },
    onSuccess: (data) => {
      setGeneratedCredentials(data);
      toast({
        title: "Cliente configurado com sucesso!",
        description: "Instalação criada e credenciais geradas",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao configurar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ClientSetupData, value: string) => {
    setSetupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setupMutation.mutate(setupData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  const downloadInstaller = () => {
    // Create installer configuration
    const installerConfig = {
      businessName: setupData.businessName,
      businessEmail: setupData.businessEmail,
      businessPhone: setupData.businessPhone,
      businessAddress: setupData.businessAddress,
      installationId: generatedCredentials?.installationId,
      apiKey: generatedCredentials?.apiKey,
      serverUrl: window.location.origin,
      setupDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(installerConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entrega-facil-${setupData.businessName.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurar Novo Cliente</h1>
        <p className="text-gray-600 mt-2">Crie uma instalação personalizada para seu cliente</p>
      </div>

      {!generatedCredentials ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nome da Empresa</Label>
                  <Input
                    id="businessName"
                    value={setupData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Ex: Padaria do João"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                  <Input
                    id="contactPerson"
                    value={setupData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessEmail">Email da Empresa</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={setupData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    placeholder="contato@padaria.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessPhone">Telefone</Label>
                  <Input
                    id="businessPhone"
                    value={setupData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    placeholder="(83) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Endereço da Empresa</Label>
                <Textarea
                  id="businessAddress"
                  value={setupData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="Rua das Flores, 123, Centro, Conde - PB"
                  required
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tipo de Plano</Label>
                  {plansLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {plans.map((plan) => (
                        <Card 
                          key={plan.id} 
                          className={`cursor-pointer transition-all ${
                            setupData.planType === plan.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleInputChange('planType', plan.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: plan.color }}
                                />
                                <h3 className="font-semibold text-lg">{plan.name}</h3>
                              </div>
                              {setupData.planType === plan.id && (
                                <Check className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            
                            <div className="text-center mb-3">
                              <div className="text-xl font-bold text-blue-600">
                                {plan.period === 'per_delivery' 
                                  ? `R$ ${plan.price.toFixed(2)} por entrega`
                                  : `R$ ${plan.price.toFixed(2)}/mês`
                                }
                              </div>
                              <Badge variant="secondary" className="mt-1">
                                {plan.period === 'monthly' ? 'Mensal' : 
                                 plan.period === 'per_delivery' ? 'Por Entrega' : 
                                 plan.period}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg mb-3">
                              <Truck className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium">
                                {plan.deliveryLimit ? (
                                  `${plan.deliveryLimit} entregas`
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Infinity className="h-3 w-3" />
                                    Ilimitado
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {plan.features.slice(0, 3).map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  {feature}
                                </div>
                              ))}
                              {plan.features.length > 3 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  +{plan.features.length - 3} outros recursos
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Tipo de Instalação</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={setupData.installationType === 'online' ? 'default' : 'outline'}
                      onClick={() => handleInputChange('installationType', 'online')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Online
                    </Button>
                    <Button
                      type="button"
                      variant={setupData.installationType === 'local' ? 'default' : 'outline'}
                      onClick={() => handleInputChange('installationType', 'local')}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Local
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={setupMutation.isPending || !setupData.planType}
              >
                {setupMutation.isPending ? 'Configurando...' : 'Criar Instalação'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                Cliente Configurado com Sucesso!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700">
                A instalação foi criada para <strong>{setupData.businessName}</strong>
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Credenciais</TabsTrigger>
              <TabsTrigger value="access">Acesso</TabsTrigger>
              <TabsTrigger value="installer">Instalador</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Credenciais de Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID da Instalação</Label>
                    <div className="flex gap-2">
                      <Input value={generatedCredentials.installationId} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.installationId)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave de API</Label>
                    <div className="flex gap-2">
                      <Input value={generatedCredentials.apiKey} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.apiKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Acesso ao Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL de Acesso</Label>
                    <div className="flex gap-2">
                      <Input value={generatedCredentials.accessUrl} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials.accessUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generatedCredentials.accessUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Instruções para o Cliente:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>1. Acesse a URL fornecida</li>
                      <li>2. Faça login com as credenciais do merchant</li>
                      <li>3. Comece a solicitar entregas</li>
                      <li>4. Acompanhe o status em tempo real</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="installer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Instalador Local
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Informações da Instalação:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Empresa:</span> {setupData.businessName}
                      </div>
                      <div>
                        <span className="font-medium">Contato:</span> {setupData.contactPerson}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {setupData.businessEmail}
                      </div>
                      <div>
                        <span className="font-medium">Plano:</span> {setupData.planType === 'basic' ? 'Básico' : 'Premium'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={downloadInstaller} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Configuração
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Gerar QR Code
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Próximos Passos:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>1. Envie o arquivo de configuração para o cliente</li>
                      <li>2. Cliente executa o instalador local</li>
                      <li>3. Sistema sincroniza automaticamente</li>
                      <li>4. Monitore via painel administrativo</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setGeneratedCredentials(null);
                setSetupData({
                  businessName: '',
                  businessEmail: '',
                  businessPhone: '',
                  businessAddress: '',
                  contactPerson: '',
                  planType: 'basic',
                  installationType: 'online'
                });
              }}
            >
              Configurar Novo Cliente
            </Button>
            <Button>
              Ir para Painel de Clientes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}