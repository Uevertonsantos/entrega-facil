// Distance calculation service using Haversine formula
// This provides a good approximation for delivery fee calculation

export interface DistanceResult {
  distance: number; // in kilometers
  estimatedTime: number; // in minutes
  deliveryFee: number; // calculated fee
}

export interface PricingConfig {
  baseFee: number;
  perKmRate: number;
  minimumFee: number;
  maximumFee: number;
  timeBasedMultiplier?: number;
}

// Default pricing configuration
const DEFAULT_PRICING: PricingConfig = {
  baseFee: 5.00,        // Taxa base: R$ 5.00
  perKmRate: 2.50,      // Por km: R$ 2.50
  minimumFee: 7.00,     // Mínimo: R$ 7.00
  maximumFee: 25.00,    // Máximo: R$ 25.00
};

/**
 * Calculate the distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance and urban factors
 * @param distance Distance in kilometers
 * @returns Estimated time in minutes
 */
function estimateTravelTime(distance: number): number {
  // Urban delivery speed: ~25 km/h average (including stops, traffic)
  const urbanSpeed = 25;
  const baseTime = (distance / urbanSpeed) * 60; // Convert to minutes
  
  // Add buffer time for preparation and delivery
  const bufferTime = Math.min(distance * 2, 15); // 2 min per km, max 15 min
  
  return Math.round(baseTime + bufferTime);
}

/**
 * Calculate delivery fee based on distance and time
 * @param distance Distance in kilometers
 * @param config Pricing configuration
 * @returns Calculated delivery fee
 */
function calculateDeliveryFee(distance: number, config: PricingConfig = DEFAULT_PRICING): number {
  let fee = config.baseFee + (distance * config.perKmRate);
  
  // Apply minimum and maximum limits
  fee = Math.max(fee, config.minimumFee);
  fee = Math.min(fee, config.maximumFee);
  
  return Math.round(fee * 100) / 100; // Round to 2 decimal places
}

/**
 * Simple geocoding using OpenStreetMap Nominatim (free)
 * @param address Address to geocode
 * @returns Coordinates {lat, lon} or null if not found
 */
export async function geocodeAddress(address: string): Promise<{lat: number, lon: number} | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeliveryExpress/1.0 (delivery management system)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance and delivery fee between two addresses
 * @param pickupAddress Pickup address
 * @param deliveryAddress Delivery address
 * @param config Optional pricing configuration
 * @returns Distance result with fee calculation
 */
export async function calculateDeliveryDistance(
  pickupAddress: string,
  deliveryAddress: string,
  config: PricingConfig = DEFAULT_PRICING
): Promise<DistanceResult | null> {
  try {
    // Geocode both addresses
    const [pickupCoords, deliveryCoords] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(deliveryAddress)
    ]);
    
    if (!pickupCoords || !deliveryCoords) {
      console.error('Failed to geocode addresses');
      return null;
    }
    
    // Calculate straight-line distance
    const straightDistance = calculateHaversineDistance(
      pickupCoords.lat,
      pickupCoords.lon,
      deliveryCoords.lat,
      deliveryCoords.lon
    );
    
    // Apply road factor (roads are not straight lines)
    // Urban areas: ~1.3x factor, rural areas: ~1.2x factor
    const roadFactor = 1.3;
    const actualDistance = straightDistance * roadFactor;
    
    // Calculate estimated time and fee
    const estimatedTime = estimateTravelTime(actualDistance);
    const deliveryFee = calculateDeliveryFee(actualDistance, config);
    
    return {
      distance: Math.round(actualDistance * 100) / 100, // Round to 2 decimal places
      estimatedTime,
      deliveryFee
    };
    
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
}

/**
 * Get delivery zones for different pricing tiers
 * @param distance Distance in kilometers
 * @returns Zone information
 */
export function getDeliveryZone(distance: number): {
  zone: string;
  description: string;
  maxDistance: number;
} {
  if (distance <= 3) {
    return {
      zone: 'Zona 1',
      description: 'Área central - Entrega rápida',
      maxDistance: 3
    };
  } else if (distance <= 7) {
    return {
      zone: 'Zona 2',
      description: 'Área urbana - Entrega padrão',
      maxDistance: 7
    };
  } else if (distance <= 15) {
    return {
      zone: 'Zona 3',
      description: 'Área metropolitana - Entrega estendida',
      maxDistance: 15
    };
  } else {
    return {
      zone: 'Zona 4',
      description: 'Área rural - Entrega especial',
      maxDistance: 999
    };
  }
}

/**
 * Apply surge pricing based on time and demand
 * @param baseFee Base delivery fee
 * @param currentHour Current hour (0-23)
 * @param dayOfWeek Day of week (0=Sunday, 6=Saturday)
 * @returns Adjusted fee with surge multiplier
 */
export function applySurgePricing(
  baseFee: number,
  currentHour: number = new Date().getHours(),
  dayOfWeek: number = new Date().getDay()
): { fee: number; multiplier: number; reason: string } {
  let multiplier = 1.0;
  let reason = 'Preço normal';
  
  // Weekend evenings (Friday-Saturday 18:00-23:00)
  if ((dayOfWeek === 5 || dayOfWeek === 6) && currentHour >= 18 && currentHour <= 23) {
    multiplier = 1.5;
    reason = 'Fim de semana - Alta demanda';
  }
  // Weekday lunch rush (Monday-Friday 11:00-14:00)
  else if (dayOfWeek >= 1 && dayOfWeek <= 5 && currentHour >= 11 && currentHour <= 14) {
    multiplier = 1.2;
    reason = 'Horário de almoço - Demanda elevada';
  }
  // Weekday dinner rush (Monday-Friday 18:00-21:00)
  else if (dayOfWeek >= 1 && dayOfWeek <= 5 && currentHour >= 18 && currentHour <= 21) {
    multiplier = 1.3;
    reason = 'Horário de jantar - Demanda elevada';
  }
  // Late night (22:00-06:00)
  else if (currentHour >= 22 || currentHour <= 6) {
    multiplier = 1.4;
    reason = 'Horário noturno - Entrega especial';
  }
  
  return {
    fee: Math.round(baseFee * multiplier * 100) / 100,
    multiplier,
    reason
  };
}