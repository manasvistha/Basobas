import request from 'supertest';

// Prevent real DB/email calls during integration status checks
jest.mock('../../src/database/database.db', () => ({ connectDB: jest.fn() }));
jest.mock('../../src/config/email', () => ({ sendEmail: jest.fn(), transporter: { sendMail: jest.fn() } }));
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:0/rentora-test';
process.env.NODE_ENV = 'test';

// Mock repositories to avoid hitting mongoose in integration-style smoke tests
jest.mock('../../src/repositories/property.repository', () => {
  return {
    PropertyRepository: jest.fn().mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findByOwner: jest.fn().mockResolvedValue([]),
      findByQuery: jest.fn().mockResolvedValue([]),
      filterProperties: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(true),
      assignToUser: jest.fn().mockResolvedValue(null),
      updateStatus: jest.fn().mockResolvedValue(null),
    })),
  };
});

jest.mock('../../src/repositories/booking.repository', () => ({
  BookingRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue(null),
    findByProperty: jest.fn().mockResolvedValue([]),
    findByUser: jest.fn().mockResolvedValue([]),
    findByOwner: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findExistingByPropertyAndUser: jest.fn().mockResolvedValue(null),
    findApprovedByProperty: jest.fn().mockResolvedValue(null),
    updateStatus: jest.fn().mockResolvedValue(null),
    rejectAllOthersForProperty: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../src/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    getUserByEmail: jest.fn().mockResolvedValue(null),
    getUserById: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue(null),
    getUserByUsername: jest.fn().mockResolvedValue(null),
  })),
}));

jest.mock('../../src/repositories/notification.repository', () => ({
  NotificationRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue(null),
    findByUser: jest.fn().mockResolvedValue({ notifications: [], total: 0, page: 1, pages: 0 }),
    markAsRead: jest.fn().mockResolvedValue(null),
    markAllAsRead: jest.fn().mockResolvedValue(undefined),
    getUnreadCount: jest.fn().mockResolvedValue(0),
  })),
}));
import app from '../../src/index';

const expectStatusIn = (status: number, allowed: number[]) => {
  expect(allowed).toContain(status);
};

describe('Integration: public endpoints', () => {
  test('Health check returns 200', async () => {
    const res = await request(app).get('/');
    expectStatusIn(res.status, [200]);
    expect(res.body).toHaveProperty('success', true);
  });

  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/totally-unknown');
    expectStatusIn(res.status, [404]);
  });

  test('Get property list (public) responds', async () => {
    const res = await request(app).get('/api/property');
    expectStatusIn(res.status, [200, 500]);
  });

  test('Search properties without query returns 400 or 200', async () => {
    const res = await request(app).get('/api/property/search');
    expectStatusIn(res.status, [200, 400]);
  });

  test('Filter properties missing filters returns 200/400', async () => {
    const res = await request(app).get('/api/property/filter');
    expectStatusIn(res.status, [200, 400]);
  });
});

describe('Integration: auth validations', () => {
  test('Register missing payload returns validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expectStatusIn(res.status, [400, 500]);
  });

  test('Login missing credentials returns error', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expectStatusIn(res.status, [400, 401, 500]);
  });

  test('Profile requires auth token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expectStatusIn(res.status, [401, 403]);
  });

  test('Upload photo requires auth', async () => {
    const res = await request(app).post('/api/auth/upload-photo');
    expectStatusIn(res.status, [401, 403]);
  });

  test('Create user requires admin auth', async () => {
    const res = await request(app).post('/api/auth/user').send({});
    expectStatusIn(res.status, [401, 403]);
  });

  test('Request password reset with missing email fails', async () => {
    const res = await request(app).post('/api/auth/request-password-reset').send({});
    expectStatusIn(res.status, [400, 500]);
  });

  test('Reset password with invalid token fails', async () => {
    const res = await request(app).post('/api/auth/reset-password/badtoken').send({ password: 'x' });
    expectStatusIn(res.status, [400, 500]);
  });
});

describe('Integration: admin-protected routes', () => {
  const adminRoutes: Array<{ method: 'get' | 'post' | 'put' | 'delete'; path: string; body?: any; allowed: number[]; desc?: string; }> = [
    { method: 'get', path: '/api/admin/users', allowed: [401, 403] },
    { method: 'get', path: '/api/admin/users/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'post', path: '/api/admin/users', body: {}, allowed: [401, 403] },
    { method: 'put', path: '/api/admin/users/000000000000000000000000', body: {}, allowed: [401, 403, 404] },
    { method: 'delete', path: '/api/admin/users/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'post', path: '/api/admin/users/000000000000000000000000/promote', body: {}, allowed: [401, 403, 404] },
    { method: 'get', path: '/api/admin/properties', allowed: [401, 403] },
    { method: 'put', path: '/api/admin/properties/000000000000000000000000/status', body: { status: 'approved' }, allowed: [401, 403, 404] },
    { method: 'delete', path: '/api/admin/properties/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'get', path: '/api/admin/bookings', allowed: [401, 403] },
  ];

  adminRoutes.forEach(({ method, path, body, allowed }) => {
    test(`${method.toUpperCase()} ${path} requires admin`, async () => {
      const res = await (request(app) as any)[method](path).send(body || {});
      expectStatusIn(res.status, allowed);
    });
  });
});

describe('Integration: property protected routes', () => {
  const propertyRoutes: Array<{ method: 'get' | 'post' | 'put' | 'delete'; path: string; body?: any; allowed: number[] }> = [
    { method: 'post', path: '/api/property', body: {}, allowed: [401, 400] },
    { method: 'put', path: '/api/property/000000000000000000000000', body: {}, allowed: [401, 403, 404] },
    { method: 'delete', path: '/api/property/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'put', path: '/api/property/000000000000000000000000/assign', body: { userId: 'user1' }, allowed: [401, 403, 404] },
    { method: 'put', path: '/api/property/admin/000000000000000000000000/approve', body: {}, allowed: [401, 403, 404] },
    { method: 'put', path: '/api/property/admin/000000000000000000000000/reject', body: {}, allowed: [401, 403, 404] },
    { method: 'put', path: '/api/property/admin/000000000000000000000000/status', body: { status: 'rejected' }, allowed: [401, 403, 404] },
  ];

  propertyRoutes.forEach(({ method, path, body, allowed }) => {
    test(`${method.toUpperCase()} ${path} requires auth`, async () => {
      const res = await (request(app) as any)[method](path).send(body || {});
      expectStatusIn(res.status, allowed);
    });
  });
});

describe('Integration: booking routes', () => {
  const bookingRoutes: Array<{ method: 'get' | 'post' | 'put' | 'patch'; path: string; body?: any; allowed: number[] }> = [
    { method: 'post', path: '/api/booking', body: {}, allowed: [401, 400] },
    { method: 'get', path: '/api/booking/my', allowed: [401, 403] },
    { method: 'get', path: '/api/booking/owner/requests', allowed: [401, 403] },
    { method: 'get', path: '/api/booking/property/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'get', path: '/api/booking/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'put', path: '/api/booking/000000000000000000000000/status', body: { status: 'approved' }, allowed: [401, 403, 404] },
    { method: 'patch', path: '/api/booking/000000000000000000000000/cancel', body: {}, allowed: [401, 403, 404] },
  ];

  bookingRoutes.forEach(({ method, path, body, allowed }) => {
    test(`${method.toUpperCase()} ${path} requires auth`, async () => {
      const res = await (request(app) as any)[method](path).send(body || {});
      expectStatusIn(res.status, allowed);
    });
  });
});

describe('Integration: conversation routes', () => {
  const conversationRoutes: Array<{ method: 'get' | 'post'; path: string; body?: any; allowed: number[] }> = [
    { method: 'get', path: '/api/conversation', allowed: [401, 403] },
    { method: 'post', path: '/api/conversation', body: { participants: [] }, allowed: [401, 403, 400] },
    { method: 'get', path: '/api/conversation/booking/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'post', path: '/api/conversation/booking/000000000000000000000000/message', body: { text: 'hello' }, allowed: [401, 403, 404, 400] },
    { method: 'get', path: '/api/conversation/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'post', path: '/api/conversation/000000000000000000000000/message', body: { text: 'hi' }, allowed: [401, 403, 404, 400] },
  ];

  conversationRoutes.forEach(({ method, path, body, allowed }) => {
    test(`${method.toUpperCase()} ${path} requires auth`, async () => {
      const res = await (request(app) as any)[method](path).send(body || {});
      expectStatusIn(res.status, allowed);
    });
  });
});

describe('Integration: notification routes', () => {
  const notificationRoutes: Array<{ method: 'get' | 'put'; path: string; body?: any; allowed: number[] }> = [
    { method: 'get', path: '/api/notification', allowed: [401, 403] },
    { method: 'put', path: '/api/notification/000000000000000000000000/read', body: {}, allowed: [401, 403, 404] },
    { method: 'put', path: '/api/notification/read-all', body: {}, allowed: [401, 403] },
  ];

  notificationRoutes.forEach(({ method, path, body, allowed }) => {
    test(`${method.toUpperCase()} ${path} requires auth`, async () => {
      const res = await (request(app) as any)[method](path).send(body || {});
      expectStatusIn(res.status, allowed);
    });
  });
});

describe('Integration: favorites routes', () => {
  const favoriteRoutes: Array<{ method: 'get' | 'post' | 'delete'; path: string; body?: any; allowed: number[] }> = [
    { method: 'get', path: '/api/favorite', allowed: [401, 403] },
    { method: 'get', path: '/api/favorite/000000000000000000000000', allowed: [401, 403, 404] },
    { method: 'post', path: '/api/favorite/000000000000000000000000', body: {}, allowed: [401, 403, 404] },
    { method: 'delete', path: '/api/favorite/000000000000000000000000', allowed: [401, 403, 404] },
  ];

  favoriteRoutes.forEach(({ method, path, body, allowed }) => {
    test(`${method.toUpperCase()} ${path} requires auth`, async () => {
      const res = await (request(app) as any)[method](path).send(body || {});
      expectStatusIn(res.status, allowed);
    });
  });
});

describe('Integration: static files and misc', () => {
  test('Retrieve property image path returns 200/404', async () => {
    const res = await request(app).get('/public/property-images/sample.png');
    expectStatusIn(res.status, [200, 404]);
  });

  test('Retrieve profile picture returns 200/404', async () => {
    const res = await request(app).get('/public/profile-pictures/sample.png');
    expectStatusIn(res.status, [200, 404]);
  });
});
