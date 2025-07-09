import { db } from '../db';
import { neighborhoods } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface DeliveryCalculation {
  neighborhoodId: number;
  neighborhoodName: string;
  city: string;
  averageDistance: number;
  baseFare: number;
  totalFare: number;
  estimatedDuration: number; // em minutos
}

class NeighborhoodService {
  
  /**
   * Calcula o valor da entrega baseado no bairro de destino e cidade
   */
  async calculateDeliveryByNeighborhood(
    neighborhoodName: string,
    cityName: string,
    farePerKm: number = 2.50
  ): Promise<DeliveryCalculation | null> {
    try {
      // Busca o bairro no banco de dados pela cidade
      const neighborhood = await db
        .select()
        .from(neighborhoods)
        .where(and(
          eq(neighborhoods.name, neighborhoodName),
          eq(neighborhoods.city, cityName)
        ))
        .limit(1);

      if (!neighborhood.length) {
        return null;
      }

      const foundNeighborhood = neighborhood[0];
      
      // Calcula o valor total (tarifa base + distância)
      const distanceFare = parseFloat(foundNeighborhood.averageDistance) * farePerKm;
      const totalFare = parseFloat(foundNeighborhood.baseFare) + distanceFare;
      
      // Estima duração baseada na distância (média de 30 km/h)
      const estimatedDuration = Math.round((parseFloat(foundNeighborhood.averageDistance) / 30) * 60);

      return {
        neighborhoodId: foundNeighborhood.id,
        neighborhoodName: foundNeighborhood.name,
        city: foundNeighborhood.city,
        averageDistance: parseFloat(foundNeighborhood.averageDistance),
        baseFare: parseFloat(foundNeighborhood.baseFare),
        totalFare: parseFloat(totalFare.toFixed(2)),
        estimatedDuration: Math.max(estimatedDuration, 15), // Mínimo 15 minutos
      };
    } catch (error) {
      console.error('Erro ao calcular entrega por bairro:', error);
      return null;
    }
  }

  /**
   * Lista todos os bairros disponíveis por cidade
   */
  async getNeighborhoodsByCity(cityName: string) {
    try {
      return await db
        .select()
        .from(neighborhoods)
        .where(and(
          eq(neighborhoods.city, cityName),
          eq(neighborhoods.isActive, true)
        ))
        .orderBy(neighborhoods.name);
    } catch (error) {
      console.error('Erro ao buscar bairros da cidade:', error);
      return [];
    }
  }

  /**
   * Lista todas as cidades disponíveis
   */
  async getAllCities() {
    try {
      const cities = await db
        .selectDistinct({ city: neighborhoods.city, state: neighborhoods.state })
        .from(neighborhoods)
        .where(eq(neighborhoods.isActive, true))
        .orderBy(neighborhoods.city);
      
      return cities;
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      return [];
    }
  }

  /**
   * Cria uma nova cidade inserindo um bairro inicial
   */
  async createCity(cityName: string, stateName: string) {
    try {
      // Verifica se já existe a cidade no estado
      const existingCity = await db
        .select()
        .from(neighborhoods)
        .where(and(
          eq(neighborhoods.city, cityName),
          eq(neighborhoods.state, stateName)
        ))
        .limit(1);
      
      if (existingCity.length > 0) {
        throw new Error(`Cidade "${cityName}" já existe no estado ${stateName}`);
      }
      
      // Cria um bairro padrão "Centro" para a nova cidade
      const newNeighborhood = await db
        .insert(neighborhoods)
        .values({
          name: 'Centro',
          city: cityName,
          state: stateName,
          averageDistance: '2.0',
          baseFare: '5.00',
          deliveryFee: '8.00',
          platformFee: '2.00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return {
        city: cityName,
        state: stateName,
        neighborhood: newNeighborhood[0]
      };
    } catch (error) {
      console.error('Erro ao criar cidade:', error);
      throw error;
    }
  }

  /**
   * Busca bairros por nome em uma cidade específica (para autocomplete)
   */
  async searchNeighborhoods(query: string, cityName: string) {
    try {
      return await db
        .select()
        .from(neighborhoods)
        .where(and(
          eq(neighborhoods.city, cityName),
          eq(neighborhoods.isActive, true)
        ))
        .orderBy(neighborhoods.name)
        .then(results => 
          results.filter(n => 
            n.name.toLowerCase().includes(query.toLowerCase())
          )
        );
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
      return [];
    }
  }

  /**
   * Adiciona um novo bairro
   */
  async addNeighborhood(neighborhoodData: {
    name: string;
    city: string;
    state: string;
    averageDistance: number;
    baseFare: number;
    deliveryFee?: number;
    platformFee?: number;
  }) {
    try {
      const [newNeighborhood] = await db
        .insert(neighborhoods)
        .values({
          name: neighborhoodData.name,
          city: neighborhoodData.city,
          state: neighborhoodData.state,
          averageDistance: neighborhoodData.averageDistance.toString(),
          baseFare: neighborhoodData.baseFare.toString(),
          deliveryFee: neighborhoodData.deliveryFee?.toString() || '8.00',
          platformFee: neighborhoodData.platformFee?.toString() || '2.00',
          isActive: true
        })
        .returning();
      
      return newNeighborhood;
    } catch (error) {
      console.error('Erro ao adicionar bairro:', error);
      throw error;
    }
  }
}

export const neighborhoodService = new NeighborhoodService();