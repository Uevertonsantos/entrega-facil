import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Route, DollarSign } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
              <Button 
                onClick={handleLogin}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
