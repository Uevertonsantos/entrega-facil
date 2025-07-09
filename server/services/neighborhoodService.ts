import { db } from '../db';
import { neighborhoods } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
   * Calcula o valor da entrega baseado no bairro de destino
   */
  async calculateDeliveryByNeighborhood(
    neighborhoodName: string,
    farePerKm: number = 2.50
  ): Promise<DeliveryCalculation | null> {
    try {
      // Busca o bairro no banco de dados
      const neighborhood = await db
        .select()
        .from(neighborhoods)
        .where(eq(neighborhoods.name, neighborhoodName))
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
   * Lista todos os bairros disponíveis
   */
  async getAllNeighborhoods() {
    try {
      return await db
        .select()
        .from(neighborhoods)
        .where(eq(neighborhoods.isActive, true))
        .orderBy(neighborhoods.name);
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
      return [];
    }
  }

  /**
   * Busca bairros por nome (para autocomplete)
   */
  async searchNeighborhoods(query: string) {
    try {
      return await db
        .select()
        .from(neighborhoods)
        .where(eq(neighborhoods.isActive, true))
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
}

export const neighborhoodService = new NeighborhoodService();