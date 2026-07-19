import { isValidCoordinates, formatCoordinates, getOpenStreetMapUrl, getOpenStreetMapDirectionsUrl } from '@/lib/utils/location';

describe('location utils', () => {
  const valid = { latitude: 27.7, longitude: 85.3 };
  const invalid = { latitude: 200, longitude: 1000 };

  test('isValidCoordinates recognizes valid and invalid', () => {
    expect(isValidCoordinates(valid)).toBe(true);
    expect(isValidCoordinates(invalid)).toBe(false);
    expect(isValidCoordinates(null)).toBe(false);
  });

  test('formatCoordinates returns formatted string or empty', () => {
    expect(formatCoordinates(valid, 2)).toBe('27.70, 85.30');
    expect(formatCoordinates(null)).toBe('');
  });

  test('getOpenStreetMapUrl returns url or empty', () => {
    const url = getOpenStreetMapUrl(valid, 12);
    expect(url).toContain('openstreetmap.org');
    expect(getOpenStreetMapUrl(null)).toBe('');
  });

  test('getOpenStreetMapDirectionsUrl returns route when valid', () => {
    const from = { latitude: 27, longitude: 85 };
    const to = { latitude: 27.5, longitude: 85.5 };
    const url = getOpenStreetMapDirectionsUrl(from, to);
    expect(url).toContain('openstreetmap.org/directions');
    expect(getOpenStreetMapDirectionsUrl(null, to)).toBe('');
  });
});
