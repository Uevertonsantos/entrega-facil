import fetch from 'node-fetch';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteData {
  distance: number; // em metros
  duration: number; // em segundos
  geometry: Array<[number, number]>; // pontos da rota [longitude, latitude]
}

export interface DeliveryPricing {
  distanceKm: number;
  baseFare: number;
  distanceFare: number;
  totalFare: number;
}

class RoutingService {
  private apiKey: string;
  private baseUrl = 'https://api.openrouteservice.org/v2';

  constructor() {
    this.apiKey = process.env.OPENROUTESERVICE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouteService API key not configured. Route calculations will be disabled.');
    }
  }

  /**
   * Calcula a rota entre dois pontos
   */
  async calculateRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteData | null> {
    if (!this.apiKey) {
      console.error('OpenRouteService API key not configured');
      return null;
    }

    try {
      const coordinates = [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude]
      ];

      const response = await fetch(`${this.baseUrl}/directions/driving-car`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: coordinates,
          format: 'json',
          preference: 'fastest'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouteService API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No route found');
      }

      const route = data.features[0];
      const summary = route.properties.summary;
      
      return {
        distance: summary.distance, // metros
        duration: summary.duration, // segundos
        geometry: route.geometry.coordinates // pontos da rota
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  }

  /**
   * Calcula o preço da entrega baseado na distância
   */
  calculateDeliveryPrice(distanceMeters: number, baseFare: number = 5.00, farePerKm: number = 2.50): DeliveryPricing {
    const distanceKm = distanceMeters / 1000;
    const distanceFare = distanceKm * farePerKm;
    const totalFare = baseFare + distanceFare;

    return {
      distanceKm: Math.round(distanceKm * 100) / 100, // 2 casas decimais
      baseFare,
      distanceFare: Math.round(distanceFare * 100) / 100,
      totalFare: Math.round(totalFare * 100) / 100
    };
  }

  /**
   * Calcula matriz de distâncias entre múltiplos pontos
   */
  async calculateDistanceMatrix(locations: RoutePoint[]): Promise<number[][] | null> {
    if (!this.apiKey) {
      console.error('OpenRouteService API key not configured');
      return null;
    }

    try {
      const coordinates = locations.map(loc => [loc.longitude, loc.latitude]);

      const response = await fetch(`${this.baseUrl}/matrix/driving-car`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locations: coordinates,
          metrics: ['distance', 'duration']
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouteService API error: ${response.status}`);
      }

      const data = await response.json();
      return data.distances; // matriz de distâncias em metros
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      return null;
    }
  }

  /**
   * Encontra o entregador mais próximo
   */
  async findNearestDeliverer(
    pickupLocation: RoutePoint,
    delivererLocations: Array<{ id: number; name: string; location: RoutePoint }>
  ): Promise<{ delivererId: number; distance: number; name: string } | null> {
    if (delivererLocations.length === 0) {
      return null;
    }

    const allLocations = [pickupLocation, ...delivererLocations.map(d => d.location)];
    const distanceMatrix = await this.calculateDistanceMatrix(allLocations);
    
    if (!distanceMatrix) {
      return null;
    }

    // Distâncias do ponto de coleta (índice 0) para cada entregador
    const distances = distanceMatrix[0].slice(1);
    
    let nearestIndex = 0;
    let minDistance = distances[0];
    
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] < minDistance) {
        minDistance = distances[i];
        nearestIndex = i;
      }
    }

    return {
      delivererId: delivererLocations[nearestIndex].id,
      distance: minDistance,
      name: delivererLocations[nearestIndex].name
    };
  }

  /**
   * Calcula tempo estimado de chegada
   */
  calculateETA(distanceMeters: number, averageSpeedKmh: number = 30): number {
    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / averageSpeedKmh;
    return Math.round(timeHours * 60); // retorna em minutos
  }

  /**
   * Geocoding reverso - converte coordenadas em endereço
   */
  async reverseGeocode(location: RoutePoint): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/reverse?point.lon=${location.longitude}&point.lat=${location.latitude}&size=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].properties.label;
      }
      
      return null;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  }
}

export const routingService = new RoutingService();