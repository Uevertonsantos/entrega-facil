import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Store, 
  Plus, 
  Edit, 
  MessageSquare, 
  Search,
  Phone,
  MapPin,
  DollarSign
} from "lucide-react";
import type { Merchant } from "@shared/schema";

const merchantFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  businessName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  cnpjCpf: z.string().min(11, "CNPJ/CPF deve ter pelo menos 11 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  email: z.string().email("Email inválido"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
  planType: z.enum(["por_entrega", "mensal"]),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type MerchantFormData = z.infer<typeof merchantFormSchema>;

export default function Merchants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewMerchantOpen, setIsNewMerchantOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: merchants, isLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
    retry: false,
  });

  const form = useForm<MerchantFormData>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: {
      name: "",
      businessName: "",
      cnpjCpf: "",
      phone: "",
      email: "",
      address: "",
      businessType: "padaria",
      planType: "por_entrega",
      password: "",
    },
  });

  const createMerchantMutation = useMutation({
    mutationFn: async (data: MerchantFormData) => {
      await apiRequest("POST", "/api/merchants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Comerciante criado",
        description: "O comerciante foi criado com sucesso.",
      });
      setIsNewMerchantOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao criar comerciante. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMerchantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MerchantFormData }) => {
      await apiRequest("PUT", `/api/merchants/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] });
      toast({
        title: "Comerciante atualizado",
        description: "O comerciante foi atualizado com sucesso.",
      });
      setEditingMerchant(null);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao atualizar comerciante. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MerchantFormData) => {
    if (editingMerchant) {
      updateMerchantMutation.mutate({ id: editingMerchant.id, data });
    } else {
      createMerchantMutation.mutate(data);
    }
  };

  const handleEdit = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    form.reset({
      name: merchant.name,
      businessName: merchant.businessName,
      cnpjCpf: merchant.cnpjCpf || "",
      phone: merchant.phone,
      email: merchant.email,
      address: merchant.address,
      businessType: merchant.businessType,
      planType: merchant.planType as "por_entrega" | "mensal",
      password: "", // Password should be reset for editing
    });
  };

  const handleWhatsAppMessage = (phone: string, merchantName: string) => {
    const message = `Olá ${merchantName}, temos novidades sobre suas entregas. Entre em contato para mais detalhes.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getPlanLabel = (planType: string) => {
    if (planType === "mensal") {
      return `Mensal R$ 149`;
    }
    return `Por Entrega R$ 7-12`;
  };

  const filteredMerchants = merchants?.filter(merchant =>
    merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.businessType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Comerciantes</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Comerciantes Parceiros</h1>
        <Dialog open={isNewMerchantOpen} onOpenChange={setIsNewMerchantOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Comerciante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingMerchant ? "Editar Comerciante" : "Novo Comerciante"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Padaria do João" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Padaria do João LTDA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpjCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ/CPF</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="00.000.000/0000-00 ou 000.000.000-00" 
                            {...field}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const value = field.value.replace(/\D/g, '');
                              
                              // Se for CNPJ (14 dígitos), buscar informações
                              if (value.length === 14) {
                                try {
                                  const response = await fetch('/api/cnpj/lookup', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ cnpj: value }),
                                  });
                                  
                                  if (response.ok) {
                                    const cnpjData = await response.json();
                                    
                                    // Preencher campos automaticamente
                                    form.setValue('businessName', cnpjData.nome_fantasia || cnpjData.razao_social);
                                    form.setValue('address', `${cnpjData.logradouro}, ${cnpjData.numero} - ${cnpjData.bairro}, ${cnpjData.municipio}/${cnpjData.uf}`);
                                    if (cnpjData.telefone) {
                                      form.setValue('phone', cnpjData.telefone);
                                    }
                                    if (cnpjData.email) {
                                      form.setValue('email', cnpjData.email);
                                    }
                                    
                                    toast({
                                      title: "CNPJ encontrado",
                                      description: "Informações preenchidas automaticamente",
                                    });
                                  } else {
                                    toast({
                                      title: "CNPJ não encontrado",
                                      description: "Verifique o número e tente novamente",
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error) {
                                  console.error('Erro ao buscar CNPJ:', error);
                                  toast({
                                    title: "Erro",
                                    description: "Erro ao buscar informações do CNPJ",
                                    variant: "destructive",
                                  });
                                }
                              } else {
                                toast({
                                  title: "CNPJ inválido",
                                  description: "Digite um CNPJ válido com 14 dígitos",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="joao@padaria.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Negócio</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="padaria">Padaria</SelectItem>
                            <SelectItem value="hortifruti">Hortifruti</SelectItem>
                            <SelectItem value="papelaria">Papelaria</SelectItem>
                            <SelectItem value="farmacia">Farmácia</SelectItem>
                            <SelectItem value="mercado">Mercado</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Plano</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal (R$ 149)</SelectItem>
                            <SelectItem value="por_entrega">Por Entrega (R$ 7-12)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNewMerchantOpen(false);
                      setEditingMerchant(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMerchantMutation.isPending || updateMerchantMutation.isPending}
                  >
                    {editingMerchant ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar comerciantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Comerciantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Comerciante</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-left py-3 px-4">Plano</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants?.map((merchant) => (
                  <tr key={merchant.id} className="border-b">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{merchant.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {merchant.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {merchant.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 capitalize">
                      {merchant.businessType}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {getPlanLabel(merchant.planType)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={merchant.isActive ? "bg-secondary" : "bg-gray-400"}>
                        {merchant.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Dialog 
                          open={editingMerchant?.id === merchant.id} 
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingMerchant(null);
                              form.reset();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(merchant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Comerciante</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nome</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Ex: Padaria do João" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="businessName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nome da Empresa</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Ex: Padaria do João LTDA" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="cnpjCpf"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>CNPJ/CPF</FormLabel>
                                      <FormControl>
                                        <div className="flex gap-2">
                                          <Input 
                                            placeholder="00.000.000/0000-00 ou 000.000.000-00" 
                                            {...field}
                                            className="flex-1"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                              const value = field.value.replace(/\D/g, '');
                                              
                                              // Se for CNPJ (14 dígitos), buscar informações
                                              if (value.length === 14) {
                                                try {
                                                  const response = await fetch('/api/cnpj/lookup', {
                                                    method: 'POST',
                                                    headers: {
                                                      'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({ cnpj: value }),
                                                  });
                                                  
                                                  if (response.ok) {
                                                    const cnpjData = await response.json();
                                                    
                                                    // Preencher campos automaticamente
                                                    form.setValue('businessName', cnpjData.nome_fantasia || cnpjData.razao_social);
                                                    form.setValue('address', `${cnpjData.logradouro}, ${cnpjData.numero} - ${cnpjData.bairro}, ${cnpjData.municipio}/${cnpjData.uf}`);
                                                    if (cnpjData.telefone) {
                                                      form.setValue('phone', cnpjData.telefone);
                                                    }
                                                    if (cnpjData.email) {
                                                      form.setValue('email', cnpjData.email);
                                                    }
                                                    
                                                    toast({
                                                      title: "CNPJ encontrado",
                                                      description: "Informações preenchidas automaticamente",
                                                    });
                                                  } else {
                                                    toast({
                                                      title: "CNPJ não encontrado",
                                                      description: "Verifique o número e tente novamente",
                                                      variant: "destructive",
                                                    });
                                                  }
                                                } catch (error) {
                                                  console.error('Erro ao buscar CNPJ:', error);
                                                  toast({
                                                    title: "Erro",
                                                    description: "Erro ao buscar informações do CNPJ",
                                                    variant: "destructive",
                                                  });
                                                }
                                              } else {
                                                toast({
                                                  title: "CNPJ inválido",
                                                  description: "Digite um CNPJ válido com 14 dígitos",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                          >
                                            <Search className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input placeholder="joao@padaria.com" type="email" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Senha</FormLabel>
                                      <FormControl>
                                        <Input placeholder="••••••••" type="password" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="businessType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tipo de Negócio</FormLabel>
                                      <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="padaria">Padaria</SelectItem>
                                            <SelectItem value="hortifruti">Hortifruti</SelectItem>
                                            <SelectItem value="papelaria">Papelaria</SelectItem>
                                            <SelectItem value="farmacia">Farmácia</SelectItem>
                                            <SelectItem value="mercado">Mercado</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Telefone</FormLabel>
                                      <FormControl>
                                        <Input placeholder="(11) 99999-9999" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="address"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Endereço</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Rua, número, bairro" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="planType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tipo de Plano</FormLabel>
                                      <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="mensal">Mensal (R$ 149)</SelectItem>
                                            <SelectItem value="por_entrega">Por Entrega (R$ 7-12)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingMerchant(null);
                                      form.reset();
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    disabled={updateMerchantMutation.isPending}
                                  >
                                    Atualizar
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWhatsAppMessage(merchant.phone, merchant.name)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(!filteredMerchants || filteredMerchants.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm 
                  ? "Nenhum comerciante encontrado com o termo pesquisado"
                  : "Nenhum comerciante cadastrado"
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
