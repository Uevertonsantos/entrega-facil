import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

interface DelivererCredentials {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: string;
  isActive: boolean;
}

export default function TestCredentials() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedDeliverer, setSelectedDeliverer] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: deliverers, isLoading, refetch } = useQuery<DelivererCredentials[]>({
    queryKey: ["/api/deliverers"],
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Credencial copiada para a área de transferência",
    });
  };

  const updatePassword = async (delivererId: number, password: string) => {
    try {
      await apiRequest(`/api/deliverers/${delivererId}`, "PUT", { password });
      toast({
        title: "Senha atualizada!",
        description: "A senha do entregador foi atualizada com sucesso",
      });
      refetch();
      setNewPassword("");
      setSelectedDeliverer(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar a senha do entregador",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Credenciais de Teste</h3>
        <p className="text-sm text-muted-foreground">
          Visualize e gerencie as credenciais de acesso dos entregadores
        </p>
      </div>

      <Separator />

      {/* Admin Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">Admin</Badge>
            Acesso Administrativo
          </CardTitle>
          <CardDescription>
            Credenciais para acesso ao painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value="admin@deliveryexpress.com" readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("admin@deliveryexpress.com")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Senha</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value="admin123"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("admin123")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverer Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Entregadores</Badge>
            Credenciais dos Entregadores
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
              className="ml-auto"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPasswords ? "Ocultar" : "Mostrar"} Senhas
            </Button>
          </CardTitle>
          <CardDescription>
            Credenciais para acesso ao portal do entregador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliverers?.map((deliverer) => (
              <div key={deliverer.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{deliverer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {deliverer.vehicleType} • {deliverer.phone}
                    </p>
                  </div>
                  <Badge variant={deliverer.isActive ? "default" : "secondary"}>
                    {deliverer.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={deliverer.email} readOnly />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(deliverer.email)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type={showPasswords ? "text" : "password"}
                        value={deliverer.password}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(deliverer.password)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Password Update */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nova senha"
                      value={selectedDeliverer === deliverer.id ? newPassword : ""}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setSelectedDeliverer(deliverer.id);
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => updatePassword(deliverer.id, newPassword)}
                      disabled={!newPassword || selectedDeliverer !== deliverer.id}
                    >
                      Atualizar Senha
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Merchant Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Comerciante</Badge>
            Credenciais de Teste - Comerciante
          </CardTitle>
          <CardDescription>
            Credenciais para testar o portal do comerciante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value="alvesjonatas1996@gmail.com" readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("alvesjonatas1996@gmail.com")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Senha</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value="123456"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("123456")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}