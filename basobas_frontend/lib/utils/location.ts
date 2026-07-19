export interface PropertyCoordinates {
  latitude: number;
  longitude: number;
}

export function isValidCoordinates(
  coordinates?: PropertyCoordinates | null
): coordinates is PropertyCoordinates {
  if (!coordinates) return false;
  const { latitude, longitude } = coordinates;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function formatCoordinates(
  coordinates?: PropertyCoordinates | null,
  digits = 6
): string {
  if (!isValidCoordinates(coordinates)) return "";
  return `${coordinates.latitude.toFixed(digits)}, ${coordinates.longitude.toFixed(digits)}`;
}

export function getOpenStreetMapUrl(
  coordinates?: PropertyCoordinates | null,
  zoom = 16
): string {
  if (!isValidCoordinates(coordinates)) return "";
  const lat = coordinates.latitude.toFixed(6);
  const lon = coordinates.longitude.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
}

export function getOpenStreetMapDirectionsUrl(
  from?: PropertyCoordinates | null,
  to?: PropertyCoordinates | null
): string {
  if (!isValidCoordinates(from) || !isValidCoordinates(to)) return "";
  const fromLat = from.latitude.toFixed(6);
  const fromLon = from.longitude.toFixed(6);
  const toLat = to.latitude.toFixed(6);
  const toLon = to.longitude.toFixed(6);
  const route = `${fromLat},${fromLon};${toLat},${toLon}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(
    route
  )}`;
}
