import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Eye, EyeOff, RefreshCw, Shield, Edit } from "lucide-react";

interface DelivererCredentials {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: string;
  isActive: boolean;
}

const adminCredentialsSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório").min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email deve ter formato válido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type AdminCredentialsForm = z.infer<typeof adminCredentialsSchema>;

export default function TestCredentials() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedDeliverer, setSelectedDeliverer] = useState<number | null>(null);
  const [editingAdmin, setEditingAdmin] = useState(false);
  const { toast } = useToast();

  const adminForm = useForm<AdminCredentialsForm>({
    resolver: zodResolver(adminCredentialsSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const { data: deliverers, isLoading, refetch } = useQuery<DelivererCredentials[]>({
    queryKey: ["/api/deliverers"],
  });

  const { data: adminCredentials, refetch: refetchAdminCredentials } = useQuery({
    queryKey: ["/api/data/admin-credentials"],
    queryFn: async () => {
      const response = await apiRequest('/api/data/admin-credentials', 'GET');
      const result = await response.json();
      return result.credentials;
    },
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

  const updateAdminCredentials = async (data: AdminCredentialsForm) => {
    try {
      const response = await apiRequest('/api/admin-update-credentials', 'PUT', data);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Credenciais atualizadas!",
          description: "As credenciais administrativas foram atualizadas com sucesso",
        });
        
        // Limpar formulário e sair do modo de edição
        adminForm.reset();
        setEditingAdmin(false);
        
        // Recarregar credenciais administrativas
        refetchAdminCredentials();
      } else {
        toast({
          title: "Erro",
          description: result.message || "Falha ao atualizar as credenciais administrativas",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar as credenciais administrativas",
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Usuário</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={adminCredentials?.username || "admin"} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(adminCredentials?.username || "admin")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={adminCredentials?.email || "admin@deliveryexpress.com"} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(adminCredentials?.email || "admin@deliveryexpress.com")}
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
                  value={adminCredentials?.password || "admin123"}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(adminCredentials?.password || "admin123")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Para alterar suas credenciais administrativas, use o formulário abaixo:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newUsername">Novo Usuário</Label>
                <Input
                  id="newUsername"
                  placeholder="Digite o novo nome de usuário"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newEmail">Novo Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Digite o novo email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite a nova senha"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Button className="mt-4" onClick={() => {
              const username = (document.getElementById('newUsername') as HTMLInputElement)?.value;
              const email = (document.getElementById('newEmail') as HTMLInputElement)?.value;
              const password = (document.getElementById('newPassword') as HTMLInputElement)?.value;
              
              if (username && email && password) {
                updateAdminCredentials({ username, email, password });
              } else {
                toast({
                  title: "Erro",
                  description: "Por favor, preencha todos os campos",
                  variant: "destructive",
                });
              }
            }}>
              Atualizar Credenciais
            </Button>
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