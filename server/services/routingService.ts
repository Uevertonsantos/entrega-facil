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
      console.warn('OpenRouteService API key not configured. Using fallback distance calculations.');
    }
  }

  /**
   * Calcula a distância haversine entre dois pontos
   */
  private calculateHaversineDistance(origin: RoutePoint, destination: RoutePoint): number {
    const R = 6371000; // Raio da Terra em metros
    const lat1Rad = origin.latitude * Math.PI / 180;
    const lat2Rad = destination.latitude * Math.PI / 180;
    const deltaLatRad = (destination.latitude - origin.latitude) * Math.PI / 180;
    const deltaLonRad = (destination.longitude - origin.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Gera geometria de linha reta entre dois pontos
   */
  private generateStraightLineGeometry(origin: RoutePoint, destination: RoutePoint): Array<[number, number]> {
    return [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude]
    ];
  }

  /**
   * Calcula a rota entre dois pontos
   */
  async calculateRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteData | null> {
    // Primeiro, tenta usar a API do OpenRouteService
    if (this.apiKey) {
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

        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const route = data.features[0];
            const summary = route.properties.summary;
            
            return {
              distance: summary.distance, // metros
              duration: summary.duration, // segundos
              geometry: route.geometry.coordinates // pontos da rota
            };
          }
        }
      } catch (error) {
        console.warn('OpenRouteService API failed, using fallback calculation:', error);
      }
    }

    // Fallback: usa cálculo de distância direta
    console.log('Using fallback distance calculation');
    const distance = this.calculateHaversineDistance(origin, destination);
    const averageSpeed = 30; // km/h velocidade média urbana
    const duration = (distance / 1000) / averageSpeed * 3600; // segundos
    
    return {
      distance: Math.round(distance), // metros
      duration: Math.round(duration), // segundos
      geometry: this.generateStraightLineGeometry(origin, destination)
    };
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
    // Primeiro, tenta usar a API do OpenRouteService
    if (this.apiKey) {
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

        if (response.ok) {
          const data = await response.json();
          return data.distances; // matriz de distâncias em metros
        }
      } catch (error) {
        console.warn('OpenRouteService matrix API failed, using fallback calculation:', error);
      }
    }

    // Fallback: calcula distância direta entre todos os pontos
    console.log('Using fallback distance matrix calculation');
    const matrix: number[][] = [];
    
    for (let i = 0; i < locations.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          row.push(0);
        } else {
          const distance = this.calculateHaversineDistance(locations[i], locations[j]);
          row.push(Math.round(distance));
        }
      }
      matrix.push(row);
    }
    
    return matrix;
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