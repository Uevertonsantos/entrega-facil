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
  Infinity,
  FileText
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

interface Merchant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  cep: string;
  cnpj: string;
  type: string;
  planValue: number;
  platformFee: number;
}

interface ClientSetupData {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  contactPerson: string;
  planType: string;
  installationType: 'online' | 'local';
  selectedMerchantId?: number;
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
    installationType: 'online',
    selectedMerchantId: undefined
  });

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    installationId: string;
    apiKey: string;
    accessUrl: string;
  } | null>(null);

  // Query to fetch active plans
  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['/api/plans/active'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/plans/active', 'GET');
        const data = await response.json();
        console.log('Plans response:', data);
        return data as Plan[];
      } catch (error) {
        console.error('Error fetching plans:', error);
        throw error;
      }
    },
  });

  // Query to fetch existing merchants
  const { data: merchants = [], isLoading: merchantsLoading, error: merchantsError } = useQuery({
    queryKey: ['/api/merchants/list'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/merchants/list', 'GET');
        const data = await response.json();
        console.log('Merchants response:', data);
        return data as Merchant[];
      } catch (error) {
        console.error('Error fetching merchants:', error);
        throw error;
      }
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: ClientSetupData) => {
      const response = await apiRequest('/api/admin/setup-client', 'POST', data);
      return response.json();
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

  // Log errors and data for debugging
  console.log('Plans data:', plans);
  console.log('Plans loading:', plansLoading);
  console.log('Plans error:', plansError);
  console.log('Merchants data:', merchants);
  console.log('Merchants loading:', merchantsLoading);
  console.log('Merchants error:', merchantsError);

  // Show loading while fetching data
  if (plansLoading || merchantsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Configurar Novo Cliente</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof ClientSetupData, value: string) => {
    setSetupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMerchantSelect = (merchantId: number) => {
    const selectedMerchant = merchants.find(m => m.id === merchantId);
    if (selectedMerchant) {
      setSetupData(prev => ({
        ...prev,
        selectedMerchantId: merchantId,
        businessName: selectedMerchant.name,
        businessEmail: selectedMerchant.email,
        businessPhone: selectedMerchant.phone,
        businessAddress: selectedMerchant.address,
        contactPerson: selectedMerchant.name // Assuming contact person is the same as business name
      }));
    }
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
    // Generate installer configuration
    const config = {
      installationId: generatedCredentials?.installationId || '',
      apiKey: generatedCredentials?.apiKey || '',
      businessName: setupData.businessName,
      businessEmail: setupData.businessEmail,
      businessPhone: setupData.businessPhone,
      businessAddress: setupData.businessAddress,
      contactPerson: setupData.contactPerson,
      planType: setupData.planType,
      serverUrl: window.location.origin,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
    };

    // Generate complete installer script
    const installerScript = `@echo off
echo ====================================
echo    ENTREGA FACIL - INSTALADOR
echo ====================================
echo.
echo Configurando sistema para: ${setupData.businessName}
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/download/
    echo.
    pause
    exit /b 1
)

REM Criar diretório do sistema
if not exist "C:\\EntregaFacil" mkdir "C:\\EntregaFacil"
cd /d "C:\\EntregaFacil"

REM Criar estrutura de pastas
if not exist "config" mkdir "config"
if not exist "public" mkdir "public"
if not exist "logs" mkdir "logs"

REM Criar arquivo de configuração
echo {"installationId":"${config.installationId}","apiKey":"${config.apiKey}","businessName":"${config.businessName}","businessEmail":"${config.businessEmail}","businessPhone":"${config.businessPhone}","businessAddress":"${config.businessAddress}","serverUrl":"${config.serverUrl}","version":"${config.version}","generatedAt":"${config.generatedAt}"} > config\\installation.json

REM Criar package.json
echo {"name":"entrega-facil-local","version":"1.0.0","description":"Sistema Local Entrega Fácil","main":"server.js","scripts":{"start":"node server.js","dev":"nodemon server.js","install-service":"node install-service.js"},"dependencies":{"express":"^4.18.2","sqlite3":"^5.1.6","cors":"^2.8.5","body-parser":"^1.20.2","node-fetch":"^3.3.2"}} > package.json

REM Instalar dependências
echo Instalando dependências...
call npm install

REM Criar servidor
echo Criando servidor...
(
echo const express = require('express'^);
echo const sqlite3 = require('sqlite3'^).verbose('^);
echo const cors = require('cors'^);
echo const bodyParser = require('body-parser'^);
echo const path = require('path'^);
echo const fs = require('fs'^);
echo.
echo const app = express('^);
echo const PORT = 3000;
echo.
echo // Configuração
echo const config = JSON.parse(fs.readFileSync('./config/installation.json', 'utf8'^)^);
echo.
echo // Middleware
echo app.use(cors('^)^);
echo app.use(bodyParser.json('^)^);
echo app.use(express.static('public'^)^);
echo.
echo // Banco de dados
echo const db = new sqlite3.Database('./database.db'^);
echo.
echo // Inicializar banco
echo db.serialize((^) =^> {
echo   db.run(\`CREATE TABLE IF NOT EXISTS deliveries (
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     customer_name TEXT NOT NULL,
echo     customer_phone TEXT,
echo     delivery_address TEXT NOT NULL,
echo     pickup_address TEXT NOT NULL,
echo     description TEXT,
echo     price REAL NOT NULL,
echo     delivery_fee REAL DEFAULT 7.00,
echo     payment_method TEXT DEFAULT 'dinheiro',
echo     status TEXT DEFAULT 'pending',
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo   ^)\`^);
echo }^);
echo.
echo // Rotas
echo app.post('/api/deliveries', (req, res^) =^> {
echo   const { customerName, customerPhone, deliveryAddress, description, price, paymentMethod } = req.body;
echo   db.run(\`INSERT INTO deliveries (customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method^) VALUES (?, ?, ?, ?, ?, ?, ?^)\`, [customerName, customerPhone, deliveryAddress, config.businessAddress, description, price, paymentMethod], function(err^) {
echo     if (err^) {
echo       res.status(500^).json({ error: err.message }^);
echo       return;
echo     }
echo     res.json({ id: this.lastID, message: 'Entrega criada com sucesso' }^);
echo   }^);
echo }^);
echo.
echo app.get('/api/deliveries', (req, res^) =^> {
echo   db.all('SELECT * FROM deliveries ORDER BY created_at DESC', [], (err, rows^) =^> {
echo     if (err^) {
echo       res.status(500^).json({ error: err.message }^);
echo       return;
echo     }
echo     res.json(rows^);
echo   }^);
echo }^);
echo.
echo app.get('/', (req, res^) =^> {
echo   res.sendFile(path.join(__dirname, 'public', 'index.html'^)^);
echo }^);
echo.
echo app.listen(PORT, (^) =^> {
echo   console.log(\`Sistema Entrega Fácil rodando em http://localhost:\${PORT}\`^);
echo   console.log(\`Empresa: \${config.businessName}\`^);
echo }^);
) > server.js

echo Criando interface web...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Entrega Fácil - ${config.businessName}^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
echo         .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
echo         .header { text-align: center; margin-bottom: 30px; }
echo         .form-group { margin-bottom: 15px; }
echo         label { display: block; margin-bottom: 5px; font-weight: bold; }
echo         input, textarea, select { width: 100%%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
echo         button { background: #007bff; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; }
echo         button:hover { background: #0056b3; }
echo         .delivery-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<div class="header"^>
echo             ^<h1^>🚚 Entrega Fácil^</h1^>
echo             ^<h2^>${config.businessName}^</h2^>
echo         ^</div^>
echo         ^<form id="deliveryForm"^>
echo             ^<div class="form-group"^>
echo                 ^<label for="customerName"^>Nome do Cliente^</label^>
echo                 ^<input type="text" id="customerName" required^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo                 ^<label for="customerPhone"^>Telefone^</label^>
echo                 ^<input type="tel" id="customerPhone"^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo                 ^<label for="deliveryAddress"^>Endereço de Entrega^</label^>
echo                 ^<textarea id="deliveryAddress" required^>^</textarea^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo                 ^<label for="description"^>Descrição^</label^>
echo                 ^<textarea id="description"^>^</textarea^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo                 ^<label for="price"^>Valor (R$^)^</label^>
echo                 ^<input type="number" id="price" step="0.01" required^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo                 ^<label for="paymentMethod"^>Pagamento^</label^>
echo                 ^<select id="paymentMethod"^>
echo                     ^<option value="dinheiro"^>Dinheiro^</option^>
echo                     ^<option value="cartao"^>Cartão^</option^>
echo                     ^<option value="pix"^>PIX^</option^>
echo                 ^</select^>
echo             ^</div^>
echo             ^<button type="submit"^>Solicitar Entrega^</button^>
echo         ^</form^>
echo         ^<h3^>Entregas Solicitadas^</h3^>
echo         ^<div id="deliveriesList"^>^</div^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > public\\index.html

echo.
echo ====================================
echo    INSTALAÇÃO CONCLUÍDA!
echo ====================================
echo.
echo Sistema instalado em: C:\\EntregaFacil
echo.
echo Para iniciar o sistema:
echo cd C:\\EntregaFacil
echo npm start
echo.
echo Acesse: http://localhost:3000
echo.
pause
`;

    // Create and download the installer
    const blob = new Blob([installerScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entrega-facil-installer-${setupData.businessName.toLowerCase().replace(/\s+/g, '-')}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Instalador criado!",
      description: `Arquivo de instalação baixado: entrega-facil-installer-${setupData.businessName.toLowerCase().replace(/\s+/g, '-')}.bat`,
    });
  };

  // Show error states
  if (plansError || merchantsError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurar Novo Cliente</h1>
          <p className="text-gray-600 mt-2">Crie uma instalação personalizada para seu cliente</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erro ao carregar dados</CardTitle>
          </CardHeader>
          <CardContent>
            {plansError && <p className="text-red-700 mb-2">Erro ao carregar planos: {plansError.message}</p>}
            {merchantsError && <p className="text-red-700">Erro ao carregar comerciantes: {merchantsError.message}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {/* Merchant Selection Section */}
              <div className="space-y-4">
                <div>
                  <Label>Comerciante Existente (Opcional)</Label>
                  <p className="text-sm text-gray-600 mb-2">Selecione um comerciante já cadastrado para preencher os dados automaticamente</p>
                  {merchantsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {merchants.map((merchant) => (
                        <Card 
                          key={merchant.id} 
                          className={`cursor-pointer transition-all p-2 ${
                            setupData.selectedMerchantId === merchant.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleMerchantSelect(merchant.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{merchant.name}</div>
                              <div className="text-xs text-gray-500">{merchant.email}</div>
                              <div className="text-xs text-gray-500">{merchant.phone}</div>
                            </div>
                            {setupData.selectedMerchantId === merchant.id && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                
                {setupData.selectedMerchantId && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Dados preenchidos automaticamente do comerciante selecionado
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSetupData(prev => ({
                          ...prev,
                          selectedMerchantId: undefined,
                          businessName: '',
                          businessEmail: '',
                          businessPhone: '',
                          businessAddress: '',
                          contactPerson: ''
                        }));
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                )}
              </div>

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
                      <Input value={generatedCredentials?.installationId || ''} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials?.installationId || '')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chave de API</Label>
                    <div className="flex gap-2">
                      <Input value={generatedCredentials?.apiKey || ''} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials?.apiKey || '')}
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
                      <Input value={generatedCredentials?.accessUrl || ''} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCredentials?.accessUrl || '')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generatedCredentials?.accessUrl || '', '_blank')}
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
                      Baixar Instalador
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => {
                      const instructions = `INSTRUÇÕES - SISTEMA ENTREGA FÁCIL

PARA: ${setupData.businessName}

PASSO 1: INSTALAR NODE.JS
- Baixe em: https://nodejs.org/download/
- Instale a versão LTS (recomendada)
- Reinicie o computador após instalação

PASSO 2: EXECUTAR INSTALADOR
- Salve o arquivo entrega-facil-installer-${setupData.businessName.toLowerCase().replace(/\s+/g, '-')}.bat
- Clique com botão direito e "Executar como administrador"
- Aguarde a instalação finalizar

PASSO 3: ACESSAR SISTEMA
- Abra o navegador
- Acesse: http://localhost:3000
- Sistema estará pronto para uso

SUPORTE TÉCNICO:
- WhatsApp: (83) 99999-9999
- Email: suporte@entregafacil.com

ID DA INSTALAÇÃO: ${generatedCredentials?.installationId || ''}
CHAVE API: ${generatedCredentials?.apiKey || ''}
`;
                      const blob = new Blob([instructions], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `entrega-facil-instrucoes-${setupData.businessName.toLowerCase().replace(/\s+/g, '-')}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({
                        title: "Instruções baixadas!",
                        description: "Manual de instalação criado",
                      });
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      Instruções
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Instruções para Instalação:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>1. Baixe o arquivo instalador (.bat)</li>
                      <li>2. Envie para o cliente via email ou WhatsApp</li>
                      <li>3. Cliente deve ter Node.js instalado</li>
                      <li>4. Executar como administrador</li>
                      <li>5. Sistema será instalado em C:\EntregaFacil</li>
                      <li>6. Acesso em http://localhost:3000</li>
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