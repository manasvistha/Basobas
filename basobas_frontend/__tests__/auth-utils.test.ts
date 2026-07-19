import { getCurrentUser, getAuthToken, isAuthenticated, getImageUrl, getPropertyImageUrl, getUserData } from '@/lib/utils/auth-utils';

describe('auth-utils', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') as PropertyDescriptor;

  beforeEach(() => {
    // reset cookie
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      writable: true,
      value: ''
    });
  });

  afterEach(() => {
    if (originalCookie) Object.defineProperty(document, 'cookie', originalCookie);
  });

  test('getCurrentUser returns null when no user_data cookie', () => {
    document.cookie = '';
    expect(getCurrentUser()).toBeNull();
  });

  test('getCurrentUser parses user_data cookie', () => {
    const obj = { id: 'u1', name: 'Test' };
    document.cookie = `user_data=${encodeURIComponent(JSON.stringify(obj))}`;
    expect(getCurrentUser()).toEqual(obj);
  });

  test('getAuthToken returns token when present', () => {
    document.cookie = 'auth_token=abc123';
    expect(getAuthToken()).toBe('abc123');
  });

  test('isAuthenticated returns true only when both user and token present', () => {
    document.cookie = `user_data=${encodeURIComponent(JSON.stringify({ id: 'u1' }))}; auth_token=tok`;
    expect(isAuthenticated()).toBe(true);
  });

  test('getImageUrl handles various inputs', () => {
    expect(getImageUrl(null)).toBeNull();
    expect(getImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png');
    expect(getImageUrl('/public/profile-pictures/me.jpg')).toBe('http://localhost:5000/public/profile-pictures/me.jpg');
    expect(getImageUrl('me.jpg')).toBe('http://localhost:5000/public/profile-pictures/me.jpg');
  });

  test('getPropertyImageUrl handles various inputs', () => {
    expect(getPropertyImageUrl(null)).toBeNull();
    expect(getPropertyImageUrl('https://cdn/x.png')).toBe('https://cdn/x.png');
    expect(getPropertyImageUrl('/public/property-images/p1.jpg')).toBe('http://localhost:5000/public/property-images/p1.jpg');
    expect(getPropertyImageUrl('p1.jpg')).toBe('http://localhost:5000/public/property-images/p1.jpg');
  });

  test('getUserData proxies to getCurrentUser', () => {
    const obj = { id: 'u2' };
    document.cookie = `user_data=${encodeURIComponent(JSON.stringify(obj))}`;
    expect(getUserData()).toEqual(obj);
  });
});
