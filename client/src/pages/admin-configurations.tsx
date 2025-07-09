import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MapPin, Mail, Key, Cog } from 'lucide-react';

// Import existing pages as components
import NeighborhoodsConfig from './neighborhoods-config';
import EmailSettings from './email-settings';
import TestCredentials from './test-credentials';
import AdminSettings from './admin-settings';

export default function AdminConfigurations() {
  const [activeTab, setActiveTab] = useState('neighborhoods');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="neighborhoods" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Cidades e Bairros
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credenciais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="neighborhoods" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Configuração de Cidades e Bairros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NeighborhoodsConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmailSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Credenciais de Teste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestCredentials />
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}