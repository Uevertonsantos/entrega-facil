import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Globe, 
  DollarSign, 
  Mail, 
  Shield, 
  MapPin, 
  Route,
  Phone,
  Clock,
  Database,
  Key,
  Save,
  RefreshCw
} from 'lucide-react';

interface AdminSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  description: string;
}

interface SystemSettings {
  // Configurações Gerais
  company_name: string;
  company_description: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_address: string;
  
  // Configurações de Entrega
  default_city: string;
  delivery_base_price: string;
  delivery_price_per_km: string;
  delivery_max_distance: string;
  delivery_time_estimate: string;
  
  // Configurações de Pagamento
  platform_commission: string;
  payment_methods: string;
  auto_payment_enabled: string;
  
  // Configurações de Email
  email_smtp_host: string;
  email_smtp_port: string;
  email_smtp_user: string;
  email_smtp_password: string;
  email_enabled: string;
  
  // Configurações de Sistema
  system_timezone: string;
  system_language: string;
  maintenance_mode: string;
  debug_mode: string;
  
  // Configurações de API
  openroute_api_key: string;
  google_maps_api_key: string;
  
  // Configurações de Notificações
  sms_enabled: string;
  push_notifications_enabled: string;
  notification_sound: string;
  
  // Configurações de Segurança
  session_timeout: string;
  password_min_length: string;
  login_attempts_limit: string;
  
  // Configurações de Interface
  theme_color: string;
  logo_url: string;
  background_color: string;
  
  // Configurações de Relatórios
  report_auto_send: string;
  report_frequency: string;
  report_recipients: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Partial<SystemSettings>>({});

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    onSuccess: (data: AdminSetting[]) => {
      const settingsObj: Partial<SystemSettings> = {};
      data.forEach(setting => {
        settingsObj[setting.settingKey as keyof SystemSettings] = setting.settingValue;
      });
      setSettings(settingsObj);
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest('/api/admin/settings', 'PUT', { key, value });
    },
    onSuccess: () => {
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/test-email', 'POST', {});
    },
    onSuccess: () => {
      toast({
        title: "Email de teste enviado",
        description: "Verifique sua caixa de entrada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const testRoutingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/routing/test', 'POST', {});
    },
    onSuccess: () => {
      toast({
        title: "API de routing funcionando",
        description: "Conexão com OpenRouteService estabelecida.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na API de routing",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = (key: string) => {
    const value = settings[key as keyof SystemSettings] || '';
    updateSettingMutation.mutate({ key, value });
  };

  const SettingCard = ({ 
    title, 
    description, 
    children, 
    icon: Icon 
  }: { 
    title: string; 
    description: string; 
    children: React.ReactNode; 
    icon: any;
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  const SettingInput = ({ 
    label, 
    settingKey, 
    type = 'text', 
    placeholder = '' 
  }: { 
    label: string; 
    settingKey: string; 
    type?: string; 
    placeholder?: string;
  }) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={settingKey}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={settingKey}
          type={type}
          placeholder={placeholder}
          value={settings[settingKey as keyof SystemSettings] || ''}
          onChange={(e) => handleSettingChange(settingKey, e.target.value)}
        />
        <Button
          onClick={() => handleSaveSetting(settingKey)}
          size="sm"
          disabled={updateSettingMutation.isPending}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const SettingTextarea = ({ 
    label, 
    settingKey, 
    placeholder = '' 
  }: { 
    label: string; 
    settingKey: string; 
    placeholder?: string;
  }) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={settingKey}>{label}</Label>
      <div className="flex gap-2">
        <Textarea
          id={settingKey}
          placeholder={placeholder}
          value={settings[settingKey as keyof SystemSettings] || ''}
          onChange={(e) => handleSettingChange(settingKey, e.target.value)}
          rows={3}
        />
        <Button
          onClick={() => handleSaveSetting(settingKey)}
          size="sm"
          disabled={updateSettingMutation.isPending}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const SettingSwitch = ({ 
    label, 
    description, 
    settingKey 
  }: { 
    label: string; 
    description: string; 
    settingKey: string;
  }) => (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={settings[settingKey as keyof SystemSettings] === 'true'}
        onCheckedChange={(checked) => {
          handleSettingChange(settingKey, checked ? 'true' : 'false');
          handleSaveSetting(settingKey);
        }}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie todas as configurações da plataforma</p>
        </div>
        <Badge variant="outline">Entrega Fácil Admin</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="delivery">Entrega</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">APIs</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <SettingCard
            title="Informações da Empresa"
            description="Configure as informações básicas da sua empresa"
            icon={Globe}
          >
            <div className="space-y-4">
              <SettingInput
                label="Nome da Empresa"
                settingKey="company_name"
                placeholder="Entrega Fácil"
              />
              <SettingTextarea
                label="Descrição da Empresa"
                settingKey="company_description"
                placeholder="Descrição da sua empresa..."
              />
              <SettingInput
                label="Telefone"
                settingKey="company_phone"
                placeholder="(11) 99999-9999"
              />
              <SettingInput
                label="Email"
                settingKey="company_email"
                type="email"
                placeholder="contato@entregafacil.com"
              />
              <SettingInput
                label="Website"
                settingKey="company_website"
                placeholder="https://entregafacil.com"
              />
              <SettingTextarea
                label="Endereço"
                settingKey="company_address"
                placeholder="Endereço completo da empresa..."
              />
            </div>
          </SettingCard>

          <SettingCard
            title="Configurações de Interface"
            description="Personalize a aparência da plataforma"
            icon={Settings}
          >
            <div className="space-y-4">
              <SettingInput
                label="Cor do Tema"
                settingKey="theme_color"
                type="color"
                placeholder="#3B82F6"
              />
              <SettingInput
                label="URL do Logo"
                settingKey="logo_url"
                placeholder="https://exemplo.com/logo.png"
              />
              <SettingInput
                label="Cor de Fundo"
                settingKey="background_color"
                type="color"
                placeholder="#FFFFFF"
              />
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <SettingCard
            title="Configurações de Entrega"
            description="Configure preços e parâmetros de entrega"
            icon={MapPin}
          >
            <div className="space-y-4">
              <SettingInput
                label="Cidade Padrão"
                settingKey="default_city"
                placeholder="São Paulo"
              />
              <SettingInput
                label="Preço Base da Entrega (R$)"
                settingKey="delivery_base_price"
                type="number"
                placeholder="5.00"
              />
              <SettingInput
                label="Preço por Km (R$)"
                settingKey="delivery_price_per_km"
                type="number"
                placeholder="2.50"
              />
              <SettingInput
                label="Distância Máxima (km)"
                settingKey="delivery_max_distance"
                type="number"
                placeholder="50"
              />
              <SettingInput
                label="Tempo Estimado Base (min)"
                settingKey="delivery_time_estimate"
                type="number"
                placeholder="30"
              />
            </div>
          </SettingCard>

          <SettingCard
            title="Métodos de Pagamento"
            description="Configure os métodos de pagamento aceitos"
            icon={DollarSign}
          >
            <SettingTextarea
              label="Métodos Aceitos (separados por vírgula)"
              settingKey="payment_methods"
              placeholder="Dinheiro, Cartão de Crédito, Cartão de Débito, PIX"
            />
          </SettingCard>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <SettingCard
            title="Configurações de Pagamento"
            description="Configure comissões e pagamentos automáticos"
            icon={DollarSign}
          >
            <div className="space-y-4">
              <SettingInput
                label="Taxa da Plataforma (%)"
                settingKey="platform_commission"
                type="number"
                placeholder="10"
              />
              <SettingSwitch
                label="Pagamento Automático"
                description="Ativar pagamentos automáticos para entregadores"
                settingKey="auto_payment_enabled"
              />
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <SettingCard
            title="Configurações de Email"
            description="Configure o servidor SMTP para envio de emails"
            icon={Mail}
          >
            <div className="space-y-4">
              <SettingSwitch
                label="Email Ativo"
                description="Ativar envio de emails do sistema"
                settingKey="email_enabled"
              />
              <SettingInput
                label="Servidor SMTP"
                settingKey="email_smtp_host"
                placeholder="smtp.gmail.com"
              />
              <SettingInput
                label="Porta SMTP"
                settingKey="email_smtp_port"
                type="number"
                placeholder="587"
              />
              <SettingInput
                label="Usuário SMTP"
                settingKey="email_smtp_user"
                placeholder="usuario@gmail.com"
              />
              <SettingInput
                label="Senha SMTP"
                settingKey="email_smtp_password"
                type="password"
                placeholder="senha"
              />
              <Button
                onClick={() => testEmailMutation.mutate()}
                disabled={testEmailMutation.isPending}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Testar Configuração de Email
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <SettingCard
            title="APIs Externas"
            description="Configure as chaves de API para serviços externos"
            icon={Key}
          >
            <div className="space-y-4">
              <SettingInput
                label="OpenRouteService API Key"
                settingKey="openroute_api_key"
                type="password"
                placeholder="sua-api-key-aqui"
              />
              <Button
                onClick={() => testRoutingMutation.mutate()}
                disabled={testRoutingMutation.isPending}
                className="w-full"
              >
                <Route className="h-4 w-4 mr-2" />
                Testar API de Routing
              </Button>
              <Separator />
              <SettingInput
                label="Google Maps API Key"
                settingKey="google_maps_api_key"
                type="password"
                placeholder="sua-api-key-do-google-maps"
              />
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SettingCard
            title="Configurações do Sistema"
            description="Configure parâmetros gerais do sistema"
            icon={Database}
          >
            <div className="space-y-4">
              <SettingInput
                label="Fuso Horário"
                settingKey="system_timezone"
                placeholder="America/Sao_Paulo"
              />
              <SettingInput
                label="Idioma do Sistema"
                settingKey="system_language"
                placeholder="pt-BR"
              />
              <SettingInput
                label="Timeout de Sessão (min)"
                settingKey="session_timeout"
                type="number"
                placeholder="60"
              />
              <SettingInput
                label="Tamanho Mínimo da Senha"
                settingKey="password_min_length"
                type="number"
                placeholder="6"
              />
              <SettingInput
                label="Limite de Tentativas de Login"
                settingKey="login_attempts_limit"
                type="number"
                placeholder="5"
              />
              <SettingSwitch
                label="Modo de Manutenção"
                description="Ativar modo de manutenção do sistema"
                settingKey="maintenance_mode"
              />
              <SettingSwitch
                label="Modo Debug"
                description="Ativar logs detalhados do sistema"
                settingKey="debug_mode"
              />
            </div>
          </SettingCard>

          <SettingCard
            title="Notificações"
            description="Configure as notificações do sistema"
            icon={Phone}
          >
            <div className="space-y-4">
              <SettingSwitch
                label="SMS Ativo"
                description="Ativar envio de SMS"
                settingKey="sms_enabled"
              />
              <SettingSwitch
                label="Push Notifications"
                description="Ativar notificações push"
                settingKey="push_notifications_enabled"
              />
              <SettingSwitch
                label="Som de Notificação"
                description="Ativar som nas notificações"
                settingKey="notification_sound"
              />
            </div>
          </SettingCard>

          <SettingCard
            title="Relatórios"
            description="Configure o envio automático de relatórios"
            icon={Clock}
          >
            <div className="space-y-4">
              <SettingSwitch
                label="Envio Automático"
                description="Ativar envio automático de relatórios"
                settingKey="report_auto_send"
              />
              <SettingInput
                label="Frequência"
                settingKey="report_frequency"
                placeholder="daily"
              />
              <SettingTextarea
                label="Destinatários (emails separados por vírgula)"
                settingKey="report_recipients"
                placeholder="admin@entregafacil.com, manager@entregafacil.com"
              />
            </div>
          </SettingCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}