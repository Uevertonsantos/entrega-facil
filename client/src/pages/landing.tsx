import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Route, DollarSign, Store, User, Shield } from "lucide-react";

export default function Landing() {
  const handleMerchantLogin = () => {
    window.location.href = "/merchant-login";
  };

  const handleDelivererLogin = () => {
    window.location.href = "/deliverer-login";
  };

  const handleAdminLogin = () => {
    window.location.href = "/admin-login";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Truck className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">Entrega Fácil</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plataforma completa para gerenciar sua rede local de entregas. Conecte 
            comerciantes e entregadores de forma eficiente e rentável.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestão Completa</h3>
            <p className="text-gray-600">
              Gerencie comerciantes e entregadores em uma única plataforma
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Route className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rotas Inteligentes</h3>
            <p className="text-gray-600">
              Otimização automática de rotas para máxima eficiência
            </p>
          </div>

          <div className="text-center">
            <div className="bg-yellow-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-12 w-12 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cobrança Flexível</h3>
            <p className="text-gray-600">
              Planos mensais ou cobrança por entrega, você escolhe
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tempo Real</h3>
            <p className="text-gray-600">
              Acompanhe todas as entregas em tempo real
            </p>
          </div>
        </div>

        {/* User Type Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Escolha seu Acesso</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Merchant Card */}
            <div className="text-center bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Store className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sou Comerciante</h3>
              <p className="text-gray-600 mb-6">
                Solicite entregas para seus clientes de forma rápida e eficiente
              </p>
              <Button 
                onClick={handleMerchantLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Acessar como Comerciante
              </Button>
            </div>

            {/* Deliverer Card */}
            <div className="text-center bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sou Entregador</h3>
              <p className="text-gray-600 mb-6">
                Receba notificações de entregas e ganhe dinheiro na sua região
              </p>
              <Button 
                onClick={handleDelivererLogin}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Acessar como Entregador
              </Button>
            </div>

            {/* Admin Card */}
            <div className="text-center bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Administrador</h3>
              <p className="text-gray-600 mb-6">
                Gerencie a rede de entregas, usuários e relatórios do sistema
              </p>
              <Button 
                onClick={handleAdminLogin}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Acessar Painel Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            Desenvolvido para conectar comércios locais e entregadores de forma eficiente
          </p>
        </div>
      </div>
    </div>
  );
}
