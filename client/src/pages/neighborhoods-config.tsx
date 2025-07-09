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
  const [isAddNeighborhoodDialogOpen, setIsAddNeighborhoodDialogOpen] = useState(false);
  const [isAddCityDialogOpen, setIsAddCityDialogOpen] = useState(false);
  const [neighborhoodFormData, setNeighborhoodFormData] = useState({
    name: '',
    city: '',
    state: '',
    averageDistance: '',
    baseFare: '',
    deliveryFee: '',
    platformFee: '',
    cep: ''
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cityFormData, setCityFormData] = useState({
    city: '',
    state: ''
  });

  const checkCityExists = (cityName: string, stateName: string) => {
    return cities.some(city => 
      city.city.toLowerCase() === cityName.toLowerCase() && 
      city.state.toLowerCase() === stateName.toLowerCase()
    );
  };

  const checkNeighborhoodExists = (neighborhoodName: string, cityName: string) => {
    return neighborhoods.some(neighborhood => 
      neighborhood.name.toLowerCase() === neighborhoodName.toLowerCase() && 
      neighborhood.city.toLowerCase() === cityName.toLowerCase()
    );
  };

  const fetchCepData = async (cep: string) => {
    setIsLoadingCep(true);
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Preenche automaticamente os campos
      setNeighborhoodFormData(prev => ({
        ...prev,
        city: data.localidade,
        state: data.uf,
        name: data.bairro || '',
      }));

      toast({
        title: "CEP encontrado!",
        description: `Dados carregados para ${data.localidade}/${data.uf}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao buscar CEP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

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
      const response = await apiRequest('/api/cities', 'GET');
      const data = await response.json();
      setCities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
    }
  };

  const loadNeighborhoods = async (cityName: string) => {
    try {
      const response = await apiRequest(`/api/neighborhoods/city/${cityName}`, 'GET');
      const data = await response.json();
      setNeighborhoods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      setNeighborhoods([]);
    }
  };

  const handleNeighborhoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!neighborhoodFormData.name || !neighborhoodFormData.city || !neighborhoodFormData.state || !neighborhoodFormData.averageDistance || !neighborhoodFormData.baseFare || !neighborhoodFormData.deliveryFee || !neighborhoodFormData.platformFee) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('/api/neighborhoods', 'POST', {
        name: neighborhoodFormData.name,
        city: neighborhoodFormData.city,
        state: neighborhoodFormData.state,
        averageDistance: parseFloat(neighborhoodFormData.averageDistance),
        baseFare: parseFloat(neighborhoodFormData.baseFare),
        deliveryFee: parseFloat(neighborhoodFormData.deliveryFee),
        platformFee: parseFloat(neighborhoodFormData.platformFee)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao adicionar bairro");
      }

      toast({
        title: "Sucesso",
        description: "Bairro adicionado com sucesso!",
      });

      setIsAddNeighborhoodDialogOpen(false);
      setNeighborhoodFormData({ name: '', city: '', state: '', averageDistance: '', baseFare: '', deliveryFee: '', platformFee: '', cep: '' });
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

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityFormData.city || !cityFormData.state) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('/api/cities', 'POST', {
        city: cityFormData.city,
        state: cityFormData.state
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao adicionar cidade");
      }

      toast({
        title: "Sucesso",
        description: "Cidade adicionada com sucesso!",
      });

      setIsAddCityDialogOpen(false);
      setCityFormData({ city: '', state: '' });
      loadCities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar cidade",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure cidades e bairros para cálculos de entrega
        </p>
        <div className="flex gap-2">
          <Dialog open={isAddCityDialogOpen} onOpenChange={setIsAddCityDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nova Cidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Cidade</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCitySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cityName">Nome da Cidade</Label>
                  <Input
                    id="cityName"
                    value={cityFormData.city}
                    onChange={(e) => setCityFormData({...cityFormData, city: e.target.value})}
                    placeholder="Ex: Salvador"
                    required
                    className={checkCityExists(cityFormData.city, cityFormData.state) ? 'border-red-500' : ''}
                  />
                  {checkCityExists(cityFormData.city, cityFormData.state) && (
                    <p className="text-sm text-red-600 mt-1">Esta cidade já existe no estado {cityFormData.state}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cityState">Estado</Label>
                  <Select 
                    value={cityFormData.state} 
                    onValueChange={(value) => setCityFormData({...cityFormData, state: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddCityDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={checkCityExists(cityFormData.city, cityFormData.state)}>
                    Adicionar Cidade
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddNeighborhoodDialogOpen} onOpenChange={setIsAddNeighborhoodDialogOpen}>
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
            <form onSubmit={handleNeighborhoodSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cep">CEP (Buscar Online)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={neighborhoodFormData.cep}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 5) {
                          value = value.slice(0, 5) + '-' + value.slice(5, 8);
                        }
                        setNeighborhoodFormData({...neighborhoodFormData, cep: value});
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fetchCepData(neighborhoodFormData.cep)}
                      disabled={isLoadingCep || !neighborhoodFormData.cep}
                    >
                      {isLoadingCep ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="name">Nome do Bairro</Label>
                  <Input
                    id="name"
                    value={neighborhoodFormData.name}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, name: e.target.value})}
                    placeholder="Ex: Centro"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={neighborhoodFormData.city}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, city: e.target.value})}
                    placeholder="Ex: Salvador"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={neighborhoodFormData.state}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, state: e.target.value})}
                    placeholder="Ex: BA"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="averageDistance">Distância Média (km)</Label>
                  <Input
                    id="averageDistance"
                    type="number"
                    step="0.1"
                    value={neighborhoodFormData.averageDistance}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, averageDistance: e.target.value})}
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
                    value={neighborhoodFormData.baseFare}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, baseFare: e.target.value})}
                    placeholder="Ex: 8.00"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryFee">Valor da Entrega (R$)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    value={neighborhoodFormData.deliveryFee}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, deliveryFee: e.target.value})}
                    placeholder="Ex: 12.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="platformFee">Taxa da Plataforma (R$)</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    step="0.01"
                    value={neighborhoodFormData.platformFee}
                    onChange={(e) => setNeighborhoodFormData({...neighborhoodFormData, platformFee: e.target.value})}
                    placeholder="Ex: 2.50"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddNeighborhoodDialogOpen(false)}>
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
              {cities && cities.length > 0 ? cities.map((city) => (
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
              )) : (
                <p className="text-gray-500 text-sm">Nenhuma cidade encontrada</p>
              )}
            </div>
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
                {neighborhoods && neighborhoods.length > 0 ? neighborhoods.map((neighborhood) => (
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
                        <p className="text-sm text-gray-500">
                          Valor da entrega: R$ {parseFloat(neighborhood.deliveryFee || '8.00').toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Taxa da plataforma: R$ {parseFloat(neighborhood.platformFee || '2.00').toFixed(2)}
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
                )) : (
                  <p className="text-gray-500 text-sm">Nenhum bairro cadastrado para esta cidade</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}