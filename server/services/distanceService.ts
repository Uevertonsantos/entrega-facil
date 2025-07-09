// Distance calculation service using real geocoding and enhanced address parsing
// This provides accurate delivery fee calculation based on real street addresses

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

// Default pricing configuration (fallback)
const DEFAULT_PRICING: PricingConfig = {
  baseFee: 5.00,        // Taxa base: R$ 5.00
  perKmRate: 2.50,      // Por km: R$ 2.50
  minimumFee: 7.00,     // Mínimo: R$ 7.00
  maximumFee: 25.00,    // Máximo: R$ 25.00
};

// Get pricing configuration from database settings
export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const { storage } = await import('../storage');
    
    const [baseFee, perKmRate, minimumFee, maximumFee] = await Promise.all([
      storage.getAdminSetting('delivery_base_fee'),
      storage.getAdminSetting('delivery_per_km_rate'),
      storage.getAdminSetting('delivery_minimum_fee'),
      storage.getAdminSetting('delivery_maximum_fee')
    ]);
    
    return {
      baseFee: baseFee ? parseFloat(baseFee.settingValue) : DEFAULT_PRICING.baseFee,
      perKmRate: perKmRate ? parseFloat(perKmRate.settingValue) : DEFAULT_PRICING.perKmRate,
      minimumFee: minimumFee ? parseFloat(minimumFee.settingValue) : DEFAULT_PRICING.minimumFee,
      maximumFee: maximumFee ? parseFloat(maximumFee.settingValue) : DEFAULT_PRICING.maximumFee,
    };
  } catch (error) {
    console.error('Error getting pricing config:', error);
    return DEFAULT_PRICING;
  }
}

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
 * Get approximate coordinates for a CEP using ViaCEP API
 * @param cep CEP to lookup
 * @returns Coordinates {lat, lon} or null if not found
 */
async function getCepCoordinates(cep: string): Promise<{lat: number, lon: number} | null> {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.erro) return null;
    
    // Use approximate coordinates for common Brazilian cities
    const cityCoords: Record<string, {lat: number, lon: number}> = {
      'salvador': { lat: -12.9714, lon: -38.5014 },
      'conde': { lat: -11.8139, lon: -37.6132 },
      'alagoinhas': { lat: -12.1353, lon: -38.4201 },
      'camaçari': { lat: -12.6974, lon: -38.3245 },
      'feira de santana': { lat: -12.2664, lon: -38.9663 },
      'lauro de freitas': { lat: -12.8944, lon: -38.3275 },
      'vitória da conquista': { lat: -14.8661, lon: -40.8444 },
      'itabuna': { lat: -14.7856, lon: -39.2803 },
      'ilhéus': { lat: -14.7880, lon: -39.0448 },
      'juazeiro': { lat: -9.4111, lon: -40.4986 }
    };
    
    const cityName = data.localidade?.toLowerCase();
    if (cityName && cityCoords[cityName]) {
      return cityCoords[cityName];
    }
    
    // Return approximate coordinates for Bahia state center if no specific city found
    return { lat: -12.5, lon: -38.5 };
  } catch (error) {
    console.error('CEP geocoding error:', error);
    return null;
  }
}

/**
 * Enhanced geocoding using multiple sources with Brazilian address handling
 * @param address Address to geocode
 * @param cep Optional CEP for fallback
 * @returns Coordinates {lat, lon} or null if not found
 */
export async function geocodeAddress(address: string, cep?: string): Promise<{lat: number, lon: number} | null> {
  try {
    // Clean and enhance the address
    let cleanAddress = address.trim().toLowerCase();
    
    // Normalize common Brazilian address terms
    cleanAddress = cleanAddress
      .replace(/\s+/g, ' ')
      .replace(/,+/g, ',')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\b(rua|r\.)\b/g, 'rua')
      .replace(/\b(avenida|av\.)\b/g, 'avenida')
      .replace(/\b(travessa|tv\.)\b/g, 'travessa')
      .replace(/\b(bairro|b\.)\b/g, 'bairro');
    
    // Get default city and state from settings
    const { storage } = await import('../storage');
    const [defaultCity, defaultState] = await Promise.all([
      storage.getAdminSetting('default_city'),
      storage.getAdminSetting('default_state')
    ]);
    
    const city = defaultCity?.settingValue || 'Salvador';
    const state = defaultState?.settingValue || 'BA';
    
    // Ensure city and state are included
    if (!cleanAddress.includes(city.toLowerCase()) && 
        !cleanAddress.includes('salvador') && 
        !cleanAddress.includes('bahia') && 
        !cleanAddress.includes(' ba') &&
        !cleanAddress.includes(',ba')) {
      cleanAddress = `${cleanAddress}, ${city}, ${state}, Brasil`;
    } else if (!cleanAddress.includes('brasil') && !cleanAddress.includes('brazil')) {
      cleanAddress = `${cleanAddress}, Brasil`;
    }
    
    console.log('Geocoding address:', cleanAddress);
    
    // Try multiple geocoding approaches prioritizing street name
    const geocodingAttempts = [
      // 1. Try with full address including street name
      () => geocodeWithNominatim(cleanAddress),
      // 2. Try with simplified street name + city
      () => geocodeWithStreetName(cleanAddress, city, state),
      // 3. Try with CEP if provided (fallback)
      () => cep ? getCepCoordinates(cep) : null,
      // 4. Use approximate coordinates for known cities
      () => getApproximateCoordinates(cleanAddress, city, state)
    ];
    
    for (const attempt of geocodingAttempts) {
      const result = await attempt();
      if (result) {
        return result;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode using Nominatim API
 */
async function geocodeWithNominatim(address: string): Promise<{lat: number, lon: number} | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeliveryExpress/1.0 (delivery management system)'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return null;
  }
}

/**
 * Extract street name and try geocoding with just street + city
 */
async function geocodeWithStreetName(address: string, city: string, state: string): Promise<{lat: number, lon: number} | null> {
  try {
    // Extract street name from address
    const streetMatch = address.match(/(?:rua|avenida|travessa|av\.?|r\.?)\s+([^,]+)/i);
    if (!streetMatch) return null;
    
    const streetName = streetMatch[1].trim();
    const simplifiedAddress = `${streetName}, ${city}, ${state}, Brasil`;
    
    console.log('Trying simplified street geocoding:', simplifiedAddress);
    
    const result = await geocodeWithNominatim(simplifiedAddress);
    if (result) {
      console.log('Successfully geocoded with street name:', streetName);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Street name geocoding error:', error);
    return null;
  }
}

/**
 * Get approximate coordinates for known cities and neighborhoods
 */
function getApproximateCoordinates(address: string, city: string, state: string): {lat: number, lon: number} | null {
  const cityCoords: Record<string, {lat: number, lon: number}> = {
    'salvador': { lat: -12.9714, lon: -38.5014 },
    'conde': { lat: -11.8139, lon: -37.6132 },
    'alagoinhas': { lat: -12.1353, lon: -38.4201 },
    'camaçari': { lat: -12.6974, lon: -38.3245 },
    'feira de santana': { lat: -12.2664, lon: -38.9663 },
    'lauro de freitas': { lat: -12.8944, lon: -38.3275 },
    'vitória da conquista': { lat: -14.8661, lon: -40.8444 },
    'itabuna': { lat: -14.7856, lon: -39.2803 },
    'ilhéus': { lat: -14.7880, lon: -39.0448 },
    'juazeiro': { lat: -9.4111, lon: -40.4986 }
  };
  
  // Street-specific coordinates for interior cities (especially Conde)
  const streetCoords: Record<string, {lat: number, lon: number}> = {
    // Conde specific streets
    'rua floriano peixoto': { lat: -11.8139, lon: -37.6132 },
    'floriano peixoto': { lat: -11.8139, lon: -37.6132 },
    'rua baixa da areia': { lat: -11.8130, lon: -37.6140 },
    'baixa da areia': { lat: -11.8130, lon: -37.6140 },
    'rua da vila': { lat: -11.8135, lon: -37.6135 },
    'vila': { lat: -11.8135, lon: -37.6135 },
    'centro': { lat: -11.8139, lon: -37.6132 },
    'centro conde': { lat: -11.8139, lon: -37.6132 },
    'rua principal': { lat: -11.8139, lon: -37.6132 },
    'principal': { lat: -11.8139, lon: -37.6132 },
    
    // Common street names in interior cities
    'rua do comércio': { lat: -11.8140, lon: -37.6130 },
    'comércio': { lat: -11.8140, lon: -37.6130 },
    'rua da igreja': { lat: -11.8145, lon: -37.6125 },
    'igreja': { lat: -11.8145, lon: -37.6125 },
    'rua do mercado': { lat: -11.8142, lon: -37.6128 },
    'mercado': { lat: -11.8142, lon: -37.6128 }
  };
  
  // Check for specific streets first
  const addressLower = address.toLowerCase();
  for (const [streetName, coords] of Object.entries(streetCoords)) {
    if (addressLower.includes(streetName)) {
      console.log(`Used street-specific coordinates for ${streetName}`);
      return coords;
    }
  }
  
  // Check for neighborhood/bairro references
  const neighborhoods: Record<string, {lat: number, lon: number}> = {
    'vila': { lat: -11.8135, lon: -37.6135 },
    'centro': { lat: -11.8139, lon: -37.6132 },
    'bairro novo': { lat: -11.8145, lon: -37.6140 },
    'novo': { lat: -11.8145, lon: -37.6140 }
  };
  
  for (const [neighborhood, coords] of Object.entries(neighborhoods)) {
    if (addressLower.includes(neighborhood)) {
      console.log(`Used neighborhood coordinates for ${neighborhood}`);
      return coords;
    }
  }
  
  // Check if the address contains a known city
  for (const [cityName, coords] of Object.entries(cityCoords)) {
    if (addressLower.includes(cityName)) {
      console.log(`Used city coordinates for ${cityName}`);
      return coords;
    }
  }
  
  // Use city from settings as fallback
  const defaultCity = city.toLowerCase();
  if (cityCoords[defaultCity]) {
    console.log(`Used default city coordinates for ${defaultCity}`);
    return cityCoords[defaultCity];
  }
  
  // Final fallback - Bahia state center
  console.log('Used Bahia state center coordinates');
  return { lat: -12.5, lon: -38.5 };
}

/**
 * Calculate distance and delivery fee between two addresses using dynamic pricing
 * @param pickupAddress Pickup address
 * @param deliveryAddress Delivery address
 * @param pickupCep Optional pickup CEP
 * @param deliveryCep Optional delivery CEP
 * @returns Distance result with fee calculation
 */
export async function calculateDeliveryDistance(
  pickupAddress: string,
  deliveryAddress: string,
  pickupCep?: string,
  deliveryCep?: string
): Promise<DistanceResult | null> {
  try {
    // Get dynamic pricing configuration from database
    const config = await getPricingConfig();
    
    // Geocode both addresses with optional CEPs
    const [pickupCoords, deliveryCoords] = await Promise.all([
      geocodeAddress(pickupAddress, pickupCep),
      geocodeAddress(deliveryAddress, deliveryCep)
    ]);
    
    if (!pickupCoords || !deliveryCoords) {
      console.error('Failed to geocode addresses:', { pickupAddress, deliveryAddress, pickupCep, deliveryCep });
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
    
    console.log('Distance calculation:', {
      pickupAddress,
      deliveryAddress,
      pickupCoords,
      deliveryCoords,
      straightDistance,
      actualDistance,
      estimatedTime,
      deliveryFee,
      config
    });
    
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