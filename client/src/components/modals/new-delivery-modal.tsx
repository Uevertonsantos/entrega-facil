import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Merchant, Deliverer } from "@shared/schema";

const deliveryFormSchema = z.object({
  merchantId: z.string().min(1, "Comerciante é obrigatório"),
  delivererId: z.string().optional(),
  customerName: z.string().min(2, "Nome do cliente é obrigatório"),
  customerPhone: z.string().optional(),
  deliveryAddress: z.string().min(5, "Endereço de entrega é obrigatório"),
  deliveryFee: z.string().min(1, "Taxa de entrega é obrigatória"),
  delivererPayment: z.string().optional(),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

interface NewDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewDeliveryModal({ isOpen, onClose }: NewDeliveryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: merchants } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
    retry: false,
    enabled: isOpen,
  });

  const { data: deliverers } = useQuery<Deliverer[]>({
    queryKey: ["/api/deliverers"],
    retry: false,
    enabled: isOpen,
  });

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      merchantId: "",
      delivererId: "",
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      deliveryFee: "",
      delivererPayment: "",
      notes: "",
    },
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => {
      await apiRequest("POST", "/api/deliveries", {
        merchantId: parseInt(data.merchantId),
        delivererId: data.delivererId ? parseInt(data.delivererId) : null,
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        deliveryAddress: data.deliveryAddress,
        status: "pending",
        deliveryFee: parseFloat(data.deliveryFee),
        delivererPayment: data.delivererPayment ? parseFloat(data.delivererPayment) : null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Entrega criada",
        description: "A entrega foi criada com sucesso.",
      });
      onClose();
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
        description: "Erro ao criar entrega. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DeliveryFormData) => {
    createDeliveryMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Entrega</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="merchantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comerciante</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o comerciante" />
                        </SelectTrigger>
                        <SelectContent>
                          {merchants?.map((merchant) => (
                            <SelectItem key={merchant.id} value={merchant.id.toString()}>
                              {merchant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivererId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entregador (Opcional)</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o entregador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {deliverers?.filter(d => d.isActive).map((deliverer) => (
                            <SelectItem key={deliverer.id} value={deliverer.id.toString()}>
                              {deliverer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço de Entrega</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Rua, número, complemento, bairro, cidade"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deliveryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Entrega</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivererPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagamento ao Entregador</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a entrega"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createDeliveryMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createDeliveryMutation.isPending ? "Criando..." : "Criar Entrega"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
