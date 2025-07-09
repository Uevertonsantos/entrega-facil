import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function NeighborhoodsConfig() {
  const { toast } = useToast();
  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    averageDistance: '',
    baseFare: ''
  });

  // Load cities
  useEffect(() => {
    loadCities();
  }, []);

  // Load neighborhoods when city changes
  useEffect(() => {
    if (selectedCity) {
      loadNeighborhoods(selectedCity);
    }
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const data = await apiRequest('/api/cities', 'GET');
      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadNeighborhoods = async (cityName: string) => {
    try {
      const data = await apiRequest(`/api/neighborhoods/city/${cityName}`, 'GET');
      setNeighborhoods(data);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.state || !formData.averageDistance || !formData.baseFare) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('/api/neighborhoods', 'POST', {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        averageDistance: parseFloat(formData.averageDistance),
        baseFare: parseFloat(formData.baseFare)
      });

      toast({
        title: "Sucesso",
        description: "Bairro adicionado com sucesso!",
      });

      setIsAddDialogOpen(false);
      setFormData({ name: '', city: '', state: '', averageDistance: '', baseFare: '' });
      loadCities();
      if (selectedCity) {
        loadNeighborhoods(selectedCity);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar bairro",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuração de Cidades e Bairros</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Bairro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Bairro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Bairro</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Centro"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ex: Salvador"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="Ex: BA"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="averageDistance">Distância Média (km)</Label>
                  <Input
                    id="averageDistance"
                    type="number"
                    step="0.1"
                    value={formData.averageDistance}
                    onChange={(e) => setFormData({...formData, averageDistance: e.target.value})}
                    placeholder="Ex: 5.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="baseFare">Tarifa Base (R$)</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    step="0.01"
                    value={formData.baseFare}
                    onChange={(e) => setFormData({...formData, baseFare: e.target.value})}
                    placeholder="Ex: 8.00"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Adicionar Bairro
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cidades Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cities.map((city) => (
                <div
                  key={city.city}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCity === city.city
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCity(city.city)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{city.city}</p>
                      <p className="text-sm text-gray-500">{city.state}</p>
                    </div>
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            {cities.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhuma cidade encontrada</p>
            )}
          </CardContent>
        </Card>

        {/* Neighborhoods List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Bairros
              {selectedCity && <span className="text-sm text-gray-500 ml-2">({selectedCity})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCity ? (
              <p className="text-gray-500 text-sm">Selecione uma cidade para ver os bairros</p>
            ) : (
              <div className="space-y-2">
                {neighborhoods.map((neighborhood) => (
                  <div
                    key={neighborhood.id}
                    className="p-3 rounded-lg border hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{neighborhood.name}</p>
                        <p className="text-sm text-gray-500">
                          Distância: {neighborhood.averageDistance}km
                        </p>
                        <p className="text-sm text-gray-500">
                          Tarifa base: R$ {parseFloat(neighborhood.baseFare).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedCity && neighborhoods.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhum bairro cadastrado para esta cidade</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}