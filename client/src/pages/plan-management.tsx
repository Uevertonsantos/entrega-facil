import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Infinity
} from "lucide-react";

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'per_delivery';
  deliveryLimit: number | null; // null = unlimited
  features: string[];
  description: string;
  isActive: boolean;
  priority: number;
  color: string;
}

const defaultPlans: PlanDetails[] = [
  {
    id: 'basic',
    name: 'Plano Básico',
    price: 99.00,
    period: 'monthly',
    deliveryLimit: 50,
    features: ['Até 50 entregas por mês', 'Suporte por email', 'Painel básico'],
    description: 'Ideal para pequenos negócios que estão começando',
    isActive: true,
    priority: 1,
    color: '#3b82f6'
  },
  {
    id: 'standard',
    name: 'Plano Padrão',
    price: 149.00,
    period: 'monthly',
    deliveryLimit: 150,
    features: ['Até 150 entregas por mês', 'Suporte prioritário', 'Relatórios avançados', 'Integração com WhatsApp'],
    description: 'Perfeito para negócios em crescimento',
    isActive: true,
    priority: 2,
    color: '#10b981'
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    price: 299.00,
    period: 'monthly',
    deliveryLimit: null,
    features: ['Entregas ilimitadas', 'Suporte 24/7', 'API personalizada', 'Múltiplos usuários', 'Relatórios em tempo real'],
    description: 'Para negócios que precisam de máxima flexibilidade',
    isActive: true,
    priority: 3,
    color: '#f59e0b'
  },
  {
    id: 'per_delivery',
    name: 'Por Entrega',
    price: 10.00,
    period: 'per_delivery',
    deliveryLimit: null,
    features: ['Pague apenas pelo que usar', 'Sem compromisso mensal', 'Ideal para uso esporádico'],
    description: 'Flexibilidade total para entregas ocasionais',
    isActive: true,
    priority: 4,
    color: '#8b5cf6'
  }
];

export default function PlanManagement() {
  const [plans, setPlans] = useState<PlanDetails[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<PlanDetails | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();

  const handleCreatePlan = () => {
    const newPlan: PlanDetails = {
      id: `plan_${Date.now()}`,
      name: '',
      price: 0,
      period: 'monthly',
      deliveryLimit: null,
      features: [],
      description: '',
      isActive: true,
      priority: plans.length + 1,
      color: '#6b7280'
    };
    setEditingPlan(newPlan);
    setIsCreatingNew(true);
  };

  const handleSavePlan = (plan: PlanDetails) => {
    if (isCreatingNew) {
      setPlans([...plans, plan]);
      setIsCreatingNew(false);
    } else {
      setPlans(plans.map(p => p.id === plan.id ? plan : p));
    }
    setEditingPlan(null);
    
    toast({
      title: "Plano salvo",
      description: `O plano "${plan.name}" foi salvo com sucesso.`,
    });
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
    toast({
      title: "Plano excluído",
      description: "O plano foi removido com sucesso.",
    });
  };

  const handleToggleActive = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const getPeriodLabel = (period: PlanDetails['period']) => {
    const labels = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      per_delivery: 'Por Entrega'
    };
    return labels[period];
  };

  const formatPrice = (price: number, period: PlanDetails['period']) => {
    if (period === 'per_delivery') {
      return `R$ ${price.toFixed(2)} por entrega`;
    }
    return `R$ ${price.toFixed(2)}/${getPeriodLabel(period).toLowerCase()}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gerenciamento de Planos
          </h1>
          <p className="text-gray-600 mt-2">
            Configure planos de assinatura com limites e recursos personalizados
          </p>
        </div>
        <Button onClick={handleCreatePlan} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Planos Ativos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: plan.color }}
                      />
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => handleToggleActive(plan.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(plan.price, plan.period)}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {getPeriodLabel(plan.period)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Truck className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">
                      {plan.deliveryLimit ? (
                        `${plan.deliveryLimit} entregas`
                      ) : (
                        <span className="flex items-center gap-1">
                          <Infinity className="h-4 w-4" />
                          Ilimitado
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recursos inclusos:</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure parâmetros globais para todos os planos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período de teste gratuito (dias)</Label>
                  <Input type="number" placeholder="7" />
                </div>
                <div className="space-y-2">
                  <Label>Desconto para pagamento anual (%)</Label>
                  <Input type="number" placeholder="15" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <PlanEditModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onCancel={() => {
            setEditingPlan(null);
            setIsCreatingNew(false);
          }}
        />
      )}
    </div>
  );
}

function PlanEditModal({ 
  plan, 
  onSave, 
  onCancel 
}: { 
  plan: PlanDetails; 
  onSave: (plan: PlanDetails) => void; 
  onCancel: () => void; 
}) {
  const [editedPlan, setEditedPlan] = useState<PlanDetails>(plan);
  const [newFeature, setNewFeature] = useState('');

  const handleSave = () => {
    if (!editedPlan.name.trim()) {
      return;
    }
    onSave(editedPlan);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setEditedPlan({
        ...editedPlan,
        features: [...editedPlan.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setEditedPlan({
      ...editedPlan,
      features: editedPlan.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Editar Plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input
                value={editedPlan.name}
                onChange={(e) => setEditedPlan({...editedPlan, name: e.target.value})}
                placeholder="Ex: Plano Premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editedPlan.price}
                onChange={(e) => setEditedPlan({...editedPlan, price: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={editedPlan.period}
                onValueChange={(value: PlanDetails['period']) => setEditedPlan({...editedPlan, period: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="per_delivery">Por Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limite de Entregas</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editedPlan.deliveryLimit || ''}
                  onChange={(e) => setEditedPlan({
                    ...editedPlan, 
                    deliveryLimit: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Deixe vazio para ilimitado"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditedPlan({...editedPlan, deliveryLimit: null})}
                >
                  <Infinity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do Plano</Label>
            <Input
              type="color"
              value={editedPlan.color}
              onChange={(e) => setEditedPlan({...editedPlan, color: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={editedPlan.description}
              onChange={(e) => setEditedPlan({...editedPlan, description: e.target.value})}
              placeholder="Descreva o plano..."
            />
          </div>

          <div className="space-y-2">
            <Label>Recursos</Label>
            <div className="space-y-2">
              {editedPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={feature} readOnly />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Adicionar recurso..."
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={editedPlan.isActive}
              onCheckedChange={(checked) => setEditedPlan({...editedPlan, isActive: checked})}
            />
            <Label>Plano ativo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}