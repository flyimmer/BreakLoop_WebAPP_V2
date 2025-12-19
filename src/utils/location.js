/**
 * Location utility functions for calculating distances and checking proximity
 */

/**
 * Calculate the distance display between user location and activity location
 * @param {string} activityLocation - The location of the activity (e.g., "Munich downtown", "Marienplatz, Munich")
 * @param {string} userLocation - The user's location (e.g., "Munich")
 * @param {string} activityDescription - Optional description that might contain location info
 * @param {string} activityTitle - Optional title that might contain location info
 * @param {object} userCoordinates - Optional user coordinates {lat: number, lng: number}
 * @param {object} activityCoordinates - Optional activity coordinates {lat: number, lng: number}
 * @returns {string} - Distance display string (e.g., "Nearby", "< 5km", "15km", "500km")
 */
export function getDistanceDisplay(activityLocation, userLocation, activityDescription = "", activityTitle = "", userCoordinates = null, activityCoordinates = null) {
  // Prioritize coordinate-based distance if both are available
  if (userCoordinates && activityCoordinates && activityCoordinates.lat && activityCoordinates.lng) {
    const distanceKm = calculateDistanceFromCoords(
      userCoordinates.lat,
      userCoordinates.lng,
      activityCoordinates.lat,
      activityCoordinates.lng
    );
    
    if (distanceKm < 1) return "Nearby";
    if (distanceKm < 5) return "< 5km";
    return `${distanceKm}km`;
  }
  // If no location provided, try to extract from description or title
  // Handle both undefined and empty string cases
  let location = activityLocation;
  if (!location || (typeof location === 'string' && location.trim() === '')) {
    // Combine title and description for location extraction
    const searchText = `${activityTitle || ""} ${activityDescription || ""}`.toLowerCase();
    
    // Check if user's city is mentioned
    const userCityLower = userLocation.toLowerCase();
    if (searchText.includes(userCityLower)) {
      location = userLocation;
    } else {
      // Check for city-specific landmarks that indicate the city
      const cityLandmarks = getCityLandmarks(userLocation);
      if (cityLandmarks) {
        // Check if any landmark appears in the search text (case-insensitive)
        const foundLandmark = cityLandmarks.find(landmark => 
          searchText.includes(landmark.toLowerCase())
        );
        if (foundLandmark) {
          location = userLocation; // Landmark found, assume same city
        }
      }
    }
  }

  if (!location || !userLocation) {
    return "500km"; // Default fallback if location is missing
  }

  // Normalize locations for comparison (case-insensitive, trim whitespace)
  const normalizedActivity = location.toLowerCase().trim();
  const normalizedUser = userLocation.toLowerCase().trim();

  // Exact match - same location
  if (normalizedActivity === normalizedUser) {
    return "Nearby";
  }

  // Check if activity location contains user's city name
  // This handles cases like "Munich downtown", "Marienplatz, Munich", etc.
  if (normalizedActivity.includes(normalizedUser)) {
    // Same city, different area - show nearby with small distance
    return "< 5km";
  }

  // Check if user location contains activity location (reverse check)
  // This handles cases where user is in "Munich" and activity is in "Munich downtown"
  if (normalizedUser.includes(normalizedActivity)) {
    return "Nearby";
  }

  // Different cities - calculate approximate distance
  // For now, we'll use a simple lookup for common German cities
  // In a real app, you'd use a geocoding API or coordinate-based calculation
  const distance = estimateCityDistance(normalizedActivity, normalizedUser);
  return distance;
}

/**
 * Estimate distance between two city locations
 * This is a simplified version - in production, use geocoding APIs
 * @param {string} location1 - First location (normalized, lowercase)
 * @param {string} location2 - Second location (normalized, lowercase)
 * @returns {string} - Distance string
 */
function estimateCityDistance(location1, location2) {
  // Extract city names (take first word as city name for simplicity)
  const city1 = location1.split(/[,\s]/)[0].trim();
  const city2 = location2.split(/[,\s]/)[0].trim();

  // If cities are the same after extraction, they're nearby
  if (city1 === city2) {
    return "< 5km";
  }

  // Simple distance lookup for major German cities from Munich
  // These are approximate road distances in km
  const distancesFromMunich = {
    munich: 0,
    münchen: 0,
    augsburg: 60,
    nuremberg: 170,
    nürnberg: 170,
    stuttgart: 220,
    frankfurt: 390,
    cologne: 570,
    köln: 570,
    berlin: 580,
    hamburg: 780,
    dresden: 460,
    leipzig: 420,
    düsseldorf: 620,
    hannover: 600,
    bremen: 700,
  };

  // Check if either location matches a known city
  const dist1 = distancesFromMunich[city1];
  const dist2 = distancesFromMunich[city2];

  if (dist1 !== undefined) {
    return dist2 !== undefined ? `${Math.abs(dist1 - dist2)}km` : `${dist1}km`;
  }
  if (dist2 !== undefined) {
    return `${dist2}km`;
  }

  // If we can't determine the distance, check if locations are similar
  // (e.g., "Munich" vs "München" - different spelling, same city)
  if (areLocationsSimilar(city1, city2)) {
    return "< 5km";
  }

  // Default fallback for unknown locations
  return "500km";
}

/**
 * Check if two location strings are similar (same city, different spelling)
 * @param {string} loc1 - First location
 * @param {string} loc2 - Second location
 * @returns {boolean} - True if locations are likely the same
 */
function areLocationsSimilar(loc1, loc2) {
  // Common city name variations
  const variations = {
    munich: ["münchen", "muenchen"],
    münchen: ["munich", "muenchen"],
    muenchen: ["munich", "münchen"],
    nuremberg: ["nürnberg"],
    nürnberg: ["nuremberg"],
    cologne: ["köln"],
    köln: ["cologne"],
  };

  const normalized1 = loc1.toLowerCase();
  const normalized2 = loc2.toLowerCase();

  // Check if they're direct matches
  if (normalized1 === normalized2) return true;

  // Check if one is a variation of the other
  const vars1 = variations[normalized1] || [];
  const vars2 = variations[normalized2] || [];

  if (vars1.includes(normalized2) || vars2.includes(normalized1)) {
    return true;
  }

  return false;
}

/**
 * Get known landmarks for a city that can help identify if an activity is in that city
 * @param {string} cityName - The city name (e.g., "Munich")
 * @returns {string[]|null} - Array of landmark names, or null if city not recognized
 */
function getCityLandmarks(cityName) {
  const cityLower = cityName.toLowerCase();
  
  // Munich landmarks and areas
  if (cityLower === "munich" || cityLower === "münchen" || cityLower === "muenchen") {
    return [
      "olympiapark",
      "olympic park",
      "olympia park",
      "viktualienmarkt",
      "viktualien markt",
      "marienplatz",
      "englischer garten",
      "english garden",
      "sendlinger tor",
      "hauptbahnhof",
      "hauptbahnhof munich",
      "marienplatz glockenspiel",
      "glockenspiel",
      "nymphenburg",
      "residenz",
      "frauenkirche",
      "isartor",
      "karlsplatz",
      "stachus",
      "odeonsplatz",
      "maximilianstraße",
      "maximilianstrasse",
      "schwabing",
      "haidhausen",
      "glockenbach",
      "maxvorstadt",
      "ludwigsvorstadt",
      "sendling",
      "au",
      "westend",
      "neuhausen",
      "nymphenburg",
      "pasing",
      "trudering",
      "ramersdorf",
      "perlach",
      "allach",
      "untermenzing",
      "obermenzing",
      "moosach",
      "milbertshofen",
      "schwabing-west",
      "schwabing-ost",
      "maxvorstadt",
      "altstadt",
      "old town",
      "city center",
      "downtown",
      "zentrum",
      "innere stadt",
    ];
  }
  
  // Add other cities as needed
  // Berlin landmarks
  if (cityLower === "berlin") {
    return [
      "brandenburg gate",
      "reichstag",
      "alexanderplatz",
      "potsdamer platz",
      "checkpoint charlie",
      "museum island",
      "tiergarten",
      "kurfürstendamm",
      "charlottenburg",
      "prenzlauer berg",
      "kreuzberg",
      "mitte",
      "friedrichshain",
      "neukölln",
    ];
  }
  
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in kilometers (rounded)
 */
function calculateDistanceFromCoords(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} - Angle in radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

