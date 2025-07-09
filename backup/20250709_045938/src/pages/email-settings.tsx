import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

const emailSettingsSchema = z.object({
  gmailUser: z.string().email("Email do Gmail inválido"),
  gmailAppPassword: z.string().min(1, "Senha de app é obrigatória"),
});

type EmailSettingsData = z.infer<typeof emailSettingsSchema>;

export default function EmailSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const form = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      gmailUser: "",
      gmailAppPassword: "",
    },
  });

  // Check if email is configured
  const { data: emailStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['email-status'],
    queryFn: async () => {
      const response = await apiRequest('/api/email-status', 'GET');
      return response.json();
    },
  });

  const handleSubmit = async (data: EmailSettingsData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/email-settings', 'POST', data);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Configuração salva",
          description: "Configurações de email foram salvas com sucesso",
        });
        refetchStatus();
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao salvar configurações",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const response = await apiRequest('/api/test-email', 'POST', {
        email: form.getValues('gmailUser')
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Email de teste enviado",
          description: "Verifique sua caixa de entrada para confirmar o funcionamento",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: result.message || "Erro ao enviar email de teste",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message || "Erro ao enviar email de teste",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações de Email</h2>
        <p className="text-gray-600 mt-2">
          Configure o Gmail para envio de emails de recuperação de senha
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Status do Serviço de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {emailStatus?.configured ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600">Email configurado e funcionando</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-600">Email não configurado</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Configurações do Gmail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para usar o Gmail, você precisa:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Ativar a autenticação de 2 fatores na sua conta Google</li>
                    <li>Gerar uma "senha de app" específica para este sistema</li>
                    <li>Usar a senha de app (não sua senha normal do Gmail)</li>
                  </ol>
                  <a 
                    href="https://support.google.com/accounts/answer/185833" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Como gerar uma senha de app do Gmail →
                  </a>
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="gmailUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Gmail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="exemplo@gmail.com"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gmailAppPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha de App do Gmail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Digite a senha de app (16 caracteres)"
                              {...field}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={testingEmail || !form.getValues('gmailUser')}
                    >
                      {testingEmail ? "Testando..." : "Testar Email"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}