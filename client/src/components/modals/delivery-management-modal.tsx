import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Clock, User, Phone, Package, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import type { DeliveryWithRelations } from "@shared/schema";

interface DeliveryManagementModalProps {
  delivery: DeliveryWithRelations;
  children: React.ReactNode;
}

export default function DeliveryManagementModal({ delivery, children }: DeliveryManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(delivery.notes || "");
  const [completionNotes, setCompletionNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const queryClient = useQueryClient();

  const completeDeliveryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/deliveries/${delivery.id}/complete`, "POST", {
        notes: completionNotes.trim() || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliverers/stats'] });
      setIsOpen(false);
      toast({
        title: "Entrega concluída!",
        description: "A entrega foi marcada como concluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao concluir entrega",
        description: "Não foi possível concluir a entrega. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const cancelDeliveryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/deliveries/${delivery.id}/cancel`, "POST", {
        reason: cancellationReason.trim() || "Cancelada pelo entregador"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliverers/stats'] });
      setIsOpen(false);
      toast({
        title: "Entrega cancelada",
        description: "A entrega foi cancelada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar entrega",
        description: "Não foi possível cancelar a entrega. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/deliveries/${delivery.id}/notes`, "POST", {
        notes: notes.trim() || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/my-deliveries'] });
      toast({
        title: "Observações atualizadas",
        description: "As observações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar observações",
        description: "Não foi possível salvar as observações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const handleComplete = () => {
    if (showCompletionForm) {
      completeDeliveryMutation.mutate();
    } else {
      setShowCompletionForm(true);
    }
  };

  const handleCancel = () => {
    if (showCancellationForm) {
      cancelDeliveryMutation.mutate();
    } else {
      setShowCancellationForm(true);
    }
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Entrega #{delivery.id}</DialogTitle>
          <DialogDescription>
            Gerencie o status da entrega, adicione observações e atualize informações
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Status da Entrega</h3>
            <Badge className={getStatusColor(delivery.status)}>
              {getStatusText(delivery.status)}
            </Badge>
          </div>

          {/* Informações da Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Comerciante</Label>
                  <p className="text-sm">{delivery.merchant.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Valor</Label>
                  <p className="text-sm font-semibold">R$ {(Number(delivery.price) || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{delivery.customerName}</span>
                  {delivery.customerPhone && (
                    <>
                      <Phone className="h-4 w-4 text-gray-500 ml-2" />
                      <span className="text-sm">{delivery.customerPhone}</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Endereço de Coleta</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{delivery.pickupAddress}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Endereço de Entrega</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{delivery.deliveryAddress}</span>
                </div>
              </div>

              {delivery.scheduledTime && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Horário Agendado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(delivery.scheduledTime).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Adicione observações sobre a entrega..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={updateNotesMutation.isPending}
                size="sm"
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {updateNotesMutation.isPending ? "Salvando..." : "Salvar Observações"}
              </Button>
            </CardContent>
          </Card>

          {/* Formulário de Conclusão */}
          {showCompletionForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Concluir Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Observações finais (opcional)..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="min-h-[60px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Formulário de Cancelamento */}
          {showCancellationForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cancelar Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Motivo do cancelamento..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[60px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          {delivery.status === 'in_progress' && (
            <div className="flex gap-3">
              <Button
                onClick={handleComplete}
                disabled={completeDeliveryMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {showCompletionForm ? "Confirmar Conclusão" : "Concluir Entrega"}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelDeliveryMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {showCancellationForm ? "Confirmar Cancelamento" : "Cancelar Entrega"}
              </Button>
            </div>
          )}

          {showCompletionForm && (
            <Button
              onClick={() => setShowCompletionForm(false)}
              variant="outline"
              className="w-full"
            >
              Voltar
            </Button>
          )}

          {showCancellationForm && (
            <Button
              onClick={() => setShowCancellationForm(false)}
              variant="outline"
              className="w-full"
            >
              Voltar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}