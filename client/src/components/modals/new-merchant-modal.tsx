import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMerchantSchema, type InsertMerchant } from "@shared/schema";
import { Plus, Search } from "lucide-react";
import { z } from "zod";

type MerchantFormData = InsertMerchant;

interface NewMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewMerchantModal({ isOpen, onClose }: NewMerchantModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MerchantFormData & { password: string }>({
    resolver: zodResolver(insertMerchantSchema.extend({
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    })),
    defaultValues: {
      name: "",
      businessName: "",
      cnpjCpf: "",
      phone: "",
      email: "",
      password: "",
      address: "",
      businessType: "padaria",
      planType: "por_entrega",
      isActive: true,
    },
  });

  const createMerchant = useMutation({
    mutationFn: async (data: MerchantFormData) => {
      return await apiRequest("/api/merchants", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] });
      toast({
        title: "Sucesso",
        description: "Comerciante cadastrado com sucesso",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      let message = "Erro interno do servidor";
      
      // Extract meaningful error message from the error
      if (error.message.includes("Este email já está cadastrado")) {
        message = "Este email já está cadastrado no sistema";
      } else if (error.message.includes("400:")) {
        message = error.message.replace("400: ", "");
      } else if (error.message.includes("Invalid merchant data")) {
        message = "Dados inválidos. Verifique os campos preenchidos.";
      }
      
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MerchantFormData) => {
    createMerchant.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Comerciante</DialogTitle>
          <DialogDescription>
            Cadastre um novo comerciante no sistema com todas as informações necessárias.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="João Silva" />
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
                    <FormLabel>Nome do Negócio</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Padaria do João" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cnpjCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ/CPF</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        {...field} 
                        placeholder="00.000.000/0000-00 ou 000.000.000-00"
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(11) 99999-9999" />
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
                      <Input {...field} type="email" placeholder="joao@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Senha de acesso" />
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
                    <Input {...field} placeholder="Rua das Flores, 123" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Negócio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="padaria">Padaria</SelectItem>
                        <SelectItem value="hortifruti">Hortifruti</SelectItem>
                        <SelectItem value="minimercado">Minimercado</SelectItem>
                        <SelectItem value="papelaria">Papelaria</SelectItem>
                        <SelectItem value="farmacia">Farmácia</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                        <SelectItem value="por_entrega">Por Entrega (R$ 7-12)</SelectItem>
                        <SelectItem value="mensal">Mensal (R$ 149)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            </div>

            <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMerchant.isPending}>
                {createMerchant.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}