import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Merchant, Deliverer } from "@shared/schema";
import { Calculator, Loader2, MapPin, Clock, DollarSign } from "lucide-react";

const deliveryFormSchema = z.object({
  merchantId: z.string().min(1, "Comerciante é obrigatório"),
  delivererId: z.string().optional(),
  customerName: z.string().min(2, "Nome do cliente é obrigatório"),
  customerPhone: z.string().optional(),
  customerCpf: z.string().optional(),
  orderDescription: z.string().min(1, "Descrição do pedido é obrigatória"),
  pickupAddress: z.string().min(5, "Endereço de origem é obrigatório"),
  pickupCep: z.string().optional(),
  deliveryAddress: z.string().min(5, "Endereço de entrega é obrigatório"),
  deliveryCep: z.string().optional(),
  referencePoint: z.string().optional(),
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
  const [feeCalculation, setFeeCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: currentMerchant } = useQuery({
    queryKey: ['/api/merchants/current'],
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
      customerCpf: "",
      orderDescription: "",
      pickupAddress: "",
      pickupCep: "",
      deliveryAddress: "",
      deliveryCep: "",
      referencePoint: "",
      deliveryFee: "",
      delivererPayment: "",
      notes: "",
    },
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => {
      await apiRequest("POST", "/api/deliveries", {
        merchantId: parseInt(data.merchantId),
        delivererId: data.delivererId && data.delivererId !== "none" ? parseInt(data.delivererId) : null,
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        customerCpf: data.customerCpf || null,
        orderDescription: data.orderDescription,
        pickupAddress: data.pickupAddress,
        pickupCep: data.pickupCep || null,
        deliveryAddress: data.deliveryAddress,
        deliveryCep: data.deliveryCep || null,
        referencePoint: data.referencePoint || null,
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
      form.reset();
      setFeeCalculation(null);
      onClose();
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

  const calculateFee = async (pickupAddress: string, deliveryAddress: string) => {
    if (!pickupAddress || !deliveryAddress) {
      return;
    }

    setIsCalculating(true);
    try {
      const response = await apiRequest('POST', '/api/calculate-delivery-fee', {
        pickupAddress,
        deliveryAddress
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setFeeCalculation(result);
        // Update the delivery fee in the form
        form.setValue('deliveryFee', result.finalFee.toString());
      } else {
        toast({
          title: "Erro no cálculo",
          description: result.error || "Não foi possível calcular a taxa",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cálculo",
        description: "Não foi possível calcular a taxa de entrega",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateFee = () => {
    const pickupAddress = form.getValues('pickupAddress');
    const deliveryAddress = form.getValues('deliveryAddress');
    calculateFee(pickupAddress, deliveryAddress);
  };

  // Clean up state when modal is closed and set merchant ID
  useEffect(() => {
    if (!isOpen) {
      setFeeCalculation(null);
      form.reset();
    } else if (currentMerchant?.id) {
      form.setValue("merchantId", currentMerchant.id.toString());
    }
  }, [isOpen, form, currentMerchant]);

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto modal-scroll">
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
                      <Input 
                        value={currentMerchant?.name || "Carregando..."}
                        disabled
                        className="bg-gray-50"
                      />
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
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o entregador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormField
                control={form.control}
                name="customerCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="orderDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Pedido</FormLabel>
                  <FormControl>
                    <Input placeholder="Descreva o pedido (produtos, quantidade, etc.)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço de Origem</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Endereço de coleta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                name="pickupCep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP de Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryCep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP de Entrega</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="referencePoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ponto de Referência</FormLabel>
                  <FormControl>
                    <Input placeholder="Ponto de referência para facilitar a entrega" {...field} />
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
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCalculateFee}
                        disabled={isCalculating}
                        title="Calcular taxa automaticamente"
                      >
                        {isCalculating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Calculator className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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

            {/* Resultado do Cálculo da Taxa */}
            {feeCalculation && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-800">
                    <Calculator className="h-4 w-4 inline mr-2" />
                    Cálculo Automático da Taxa
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Distância:</span>
                      <span className="font-medium">{feeCalculation.distance} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Tempo:</span>
                      <span className="font-medium">{feeCalculation.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Taxa Base:</span>
                      <span className="font-medium">R$ {feeCalculation.baseFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {feeCalculation.zone}
                      </Badge>
                      <span className="text-gray-600">Final:</span>
                      <span className="font-semibold text-green-700">R$ {feeCalculation.finalFee.toFixed(2)}</span>
                    </div>
                  </div>
                  {feeCalculation.surgeMultiplier > 1 && (
                    <div className="mt-3 p-2 bg-orange-50 rounded-md border border-orange-200">
                      <p className="text-xs text-orange-700">
                        <strong>Surge Pricing:</strong> {feeCalculation.surgeReason} (×{feeCalculation.surgeMultiplier})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
