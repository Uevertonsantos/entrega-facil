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
import { insertDelivererSchema, type InsertDeliverer } from "@shared/schema";
import { Plus } from "lucide-react";
import { z } from "zod";

type DelivererFormData = InsertDeliverer;

interface NewDelivererModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewDelivererModal({ isOpen, onClose }: NewDelivererModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DelivererFormData & { password: string }>({
    resolver: zodResolver(insertDelivererSchema.extend({
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    })),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      vehicleType: "bicicleta",
      commissionPercentage: "20.00",
      isOnline: false,
      isActive: true,
    },
  });

  const createDeliverer = useMutation({
    mutationFn: async (data: DelivererFormData) => {
      return await apiRequest("/api/deliverers", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliverers"] });
      toast({
        title: "Sucesso",
        description: "Entregador cadastrado com sucesso",
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
      } else if (error.message.includes("Invalid deliverer data")) {
        message = "Dados inválidos. Verifique os campos preenchidos.";
      }
      
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DelivererFormData) => {
    createDeliverer.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Entregador</DialogTitle>
          <DialogDescription>
            Cadastre um novo entregador no sistema com todas as informações necessárias.
          </DialogDescription>
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
                    <Input {...field} placeholder="Maria Santos" />
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
                      <Input {...field} type="email" placeholder="maria@email.com" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Veículo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bicicleta">Bicicleta</SelectItem>
                        <SelectItem value="moto">Moto</SelectItem>
                        <SelectItem value="carro">Carro</SelectItem>
                        <SelectItem value="a_pe">A pé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="commissionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="100"
                        placeholder="20.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDeliverer.isPending}>
                {createDeliverer.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}