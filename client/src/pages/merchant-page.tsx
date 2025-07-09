import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Truck, 
  DollarSign, 
  MapPin, 
  Users, 
  BarChart3, 
  Phone, 
  Mail, 
  Clock, 
  Shield,
  ArrowLeft,
  Package,
  Route
} from "lucide-react";

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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  address: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
  planType: z.string().min(1, "Plano é obrigatório"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function MerchantPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch active plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  const activePlans = plansData?.filter((setting: any) => {
    try {
      const key = setting.settingKey || setting.key;
      const value = setting.settingValue || setting.value;
      return key?.startsWith('plan_') && value && 
             JSON.parse(value).isActive;
    } catch (error) {
      return false;
    }
  }).map((setting: any) => {
    try {
      const key = setting.settingKey || setting.key;
      const value = setting.settingValue || setting.value;
      return {
        ...JSON.parse(value),
        id: key.replace('plan_', ''),
      };
    } catch (error) {
      return null;
    }
  }).filter(Boolean) || [];

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      cnpj: "",
      address: "",
      planType: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("/api/merchants/login", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("merchantToken", data.token);
        window.location.href = "/";
      } else {
        setErrorMessage(data.message || "Erro ao fazer login");
      }
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Erro interno do servidor");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("/api/merchants/register", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("merchantToken", data.token);
        window.location.href = "/";
      } else {
        setErrorMessage(data.message || "Erro ao registrar");
      }
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Erro interno do servidor");
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    setErrorMessage("");
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    setErrorMessage("");
    
    // Find selected plan details
    const selectedPlan = activePlans.find(plan => plan.id === data.planType);
    
    const formData = {
      ...data,
      businessName: data.name,
      cnpjCpf: data.cnpj,
      businessType: "comercio",
      planValue: selectedPlan ? selectedPlan.price : 0,
      type: "comerciante",
      isActive: true,
    };
    
    registerMutation.mutate(formData);
  };

  const handleGoBack = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={handleGoBack}
              className="mb-4 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Store className="h-12 w-12 text-blue-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-900">Área do Comerciante</h1>
              </div>
              <p className="text-xl text-gray-600">
                Gerencie suas entregas de forma simples e eficiente
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Benefits Section */}
            <div className="space-y-6">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-600">
                    Por que escolher o Entrega Fácil?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Truck className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Entregas Rápidas</h3>
                      <p className="text-sm text-gray-600">
                        Rede de entregadores qualificados na sua região
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Preços Competitivos</h3>
                      <p className="text-sm text-gray-600">
                        Taxa de entrega a partir de R$ 7,00
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Rastreamento em Tempo Real</h3>
                      <p className="text-sm text-gray-600">
                        Acompanhe suas entregas do início ao fim
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Relatórios Detalhados</h3>
                      <p className="text-sm text-gray-600">
                        Analise suas vendas e entregas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Já atendemos mais de 50 comerciantes!
                  </h3>
                  <p className="text-blue-100">
                    Junte-se à nossa rede e ofereça entrega para seus clientes
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card className="text-center p-4">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Entregas</div>
                </Card>
                <Card className="text-center p-4">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600">Comerciantes</div>
                </Card>
                <Card className="text-center p-4">
                  <Route className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">25+</div>
                  <div className="text-sm text-gray-600">Entregadores</div>
                </Card>
              </div>
            </div>

            {/* Login/Register Section */}
            <div>
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">
                    Acesso do Comerciante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Entrar</TabsTrigger>
                      <TabsTrigger value="register">Cadastrar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600">
                          Já tem uma conta? Faça login abaixo
                        </p>
                      </div>

                      {errorMessage && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertDescription className="text-red-700">
                            {errorMessage}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="seu@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? "Entrando..." : "Entrar"}
                          </Button>
                        </form>
                      </Form>

                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Ainda não tem uma conta?{" "}
                          <button
                            onClick={() => setActiveTab("register")}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Cadastre-se aqui
                          </button>
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600">
                          Crie sua conta e comece a usar hoje mesmo
                        </p>
                      </div>

                      {errorMessage && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertDescription className="text-red-700">
                            {errorMessage}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Estabelecimento</FormLabel>
                                <FormControl>
                                  <Input placeholder="Padaria do João" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="seu@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(83) 99999-9999" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="cnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNPJ/CPF</FormLabel>
                                <FormControl>
                                  <Input placeholder="00.000.000/0000-00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Endereço</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua das Flores, 123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="planType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plano</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {isLoadingPlans ? (
                                      <SelectItem value="loading" disabled>Carregando planos...</SelectItem>
                                    ) : activePlans.length > 0 ? (
                                      activePlans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                          {plan.name} (R$ {plan.price}
                                          {plan.period === 'per_delivery' ? ' por entrega' : 
                                           plan.period === 'weekly' ? ' por semana' :
                                           plan.period === 'monthly' ? ' por mês' :
                                           plan.period === 'quarterly' ? ' por trimestre' :
                                           plan.period === 'annually' ? ' por ano' : ''}
                                          {plan.deliveryLimit && plan.deliveryLimit > 0 
                                            ? ` - ${plan.deliveryLimit} entregas` 
                                            : ' - Ilimitado'}
                                          )
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="por_entrega">Por Entrega (R$ 7-12)</SelectItem>
                                        <SelectItem value="mensal">Mensal (R$ 149)</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                          </Button>
                        </form>
                      </Form>

                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Já tem uma conta?{" "}
                          <button
                            onClick={() => setActiveTab("login")}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Entre aqui
                          </button>
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="mt-6 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      (83) 99999-9999
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      suporte@entregafacil.com
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}