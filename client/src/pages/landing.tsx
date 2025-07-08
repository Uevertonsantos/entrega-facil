import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Route, DollarSign, Store, User, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleMerchantLogin = () => {
    localStorage.setItem("userType", "merchant");
    window.location.href = "/api/login";
  };

  const handleDelivererLogin = () => {
    localStorage.setItem("userType", "deliverer");
    window.location.href = "/api/login";
  };

  const handleAdminLogin = () => {
    window.location.href = "/admin-login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Truck className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">Entrega Express</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma completa para gerenciar sua rede local de entregas. 
            Conecte comerciantes e entregadores de forma eficiente e rentável.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Gestão Completa</CardTitle>
              <CardDescription>
                Gerencie comerciantes e entregadores em uma única plataforma
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Route className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Rotas Inteligentes</CardTitle>
              <CardDescription>
                Otimização automática de rotas para máxima eficiência
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <DollarSign className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle>Cobrança Flexível</CardTitle>
              <CardDescription>
                Planos mensais ou cobrança por entrega, você escolhe
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Tempo Real</CardTitle>
              <CardDescription>
                Acompanhe todas as entregas em tempo real
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* User Type Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Escolha seu Acesso</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Merchant Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Store className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Sou Comerciante</CardTitle>
                <CardDescription>
                  Solicite entregas para seus clientes de forma rápida e eficiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleMerchantLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Acessar como Comerciante
                </Button>
              </CardContent>
            </Card>

            {/* Deliverer Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <User className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Sou Entregador</CardTitle>
                <CardDescription>
                  Receba notificações de entregas e ganhe dinheiro na sua região
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleDelivererLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Acessar como Entregador
                </Button>
              </CardContent>
            </Card>

            {/* Admin Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Shield className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Administrador</CardTitle>
                <CardDescription>
                  Gerencie a rede de entregas, usuários e relatórios do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAdminLogin}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Acessar Painel Admin
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Comece Agora</CardTitle>
              <CardDescription>
                Transforme sua região em uma rede de entregas eficiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Escolha uma das opções acima para acessar o sistema
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
