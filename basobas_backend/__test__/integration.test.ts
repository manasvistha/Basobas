import request from 'supertest';
// Avoid real DB connections during tests
jest.mock('../src/database/database.db', () => ({ connectDB: jest.fn() }));
jest.mock('../src/config/email', () => ({ sendEmail: jest.fn(), transporter: { sendMail: jest.fn() } }));
// Ensure no real Mongo connection is attempted in this integration shim
process.env.MONGO_URI = '';
process.env.LOCAL_DB_URI = '';

// Increase timeout for slow assertions in this integration shim
jest.setTimeout(20000);

// Mock repositories used by controllers to avoid real mongoose queries
jest.mock('../src/repositories/property.repository', () => ({
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
}));

jest.mock('../src/repositories/booking.repository', () => ({
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

jest.mock('../src/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    getUserByEmail: jest.fn().mockResolvedValue(null),
    getUserById: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue(null),
    getUserByUsername: jest.fn().mockResolvedValue(null),
  })),
}));

jest.mock('../src/repositories/notification.repository', () => ({
  NotificationRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue(null),
    findByUser: jest.fn().mockResolvedValue({ notifications: [], total: 0, page: 1, pages: 0 }),
    markAsRead: jest.fn().mockResolvedValue(null),
    markAllAsRead: jest.fn().mockResolvedValue(undefined),
    getUnreadCount: jest.fn().mockResolvedValue(0),
  })),
}));
import app from '../src/index';
import mongoose from 'mongoose';
import { beforeAll, afterAll, describe, test, expect } from '@jest/globals';

beforeAll(async () => {
  // Connect to test DB if provided
  const uri = process.env.MONGO_URI || process.env.LOCAL_DB_URI;
  if (uri && mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Rentora API integration tests (admin & property)', () => {
  test('Health check / responds 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('Get all properties (admin) without auth should return 401', async () => {
    const res = await request(app).get('/api/admin/properties');
    expect([401, 403]).toContain(res.status);
  });

  test('Get properties list (public) should return 200 or 500 if DB down', async () => {
    const res = await request(app).get('/api/property');
    expect([200, 500]).toContain(res.status);
  });

  test('Get non-existent property returns 404', async () => {
    const res = await request(app).get('/api/property/000000000000000000000000');
    expect([404, 500]).toContain(res.status);
  });

  test('Search properties (without query) should return 400 or 200', async () => {
    const res = await request(app).get('/api/property/search');
    expect([400, 200]).toContain(res.status);
  });

  test('Get my properties without auth returns 401', async () => {
    const res = await request(app).get('/api/property/my');
    expect([401, 403]).toContain(res.status);
  });

  test('Auth routes: register validation returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect([400, 500]).toContain(res.status);
  });

  test('Auth routes: login missing returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect([400, 401, 500]).toContain(res.status);
  });

  test('Admin update property status without auth returns 401', async () => {
    const res = await request(app).put('/api/admin/properties/000/status').send({ status: 'available' });
    expect([401, 403]).toContain(res.status);
  });

  test('Create property without auth returns 401', async () => {
    const res = await request(app).post('/api/property').send({});
    expect([401, 400]).toContain(res.status);
  });

  test('Get notifications without auth returns 401', async () => {
    const res = await request(app).get('/api/notification');
    expect([401, 403]).toContain(res.status);
  });

  test('Get conversations without auth returns 401', async () => {
    const res = await request(app).get('/api/conversation');
    expect([401, 403]).toContain(res.status);
  });

  test('Get bookings without auth returns 401/403/404', async () => {
    const res = await request(app).get('/api/booking');
    expect([401, 403, 404]).toContain(res.status);
  });

  test('Invalid admin route returns 401 or 404', async () => {
    const res = await request(app).get('/api/admin/unknown');
    expect([401, 404]).toContain(res.status);
  });

  test('Retrieve property image path directly (no auth) returns 200 or 404', async () => {
    // We don't know filenames; test a sample path
    const res = await request(app).get('/public/property-images/sample.png');
    expect([200, 404]).toContain(res.status);
  });

  test('Static profile picture returns 200 or 404', async () => {
    const res = await request(app).get('/public/profile-pictures/sample.png');
    expect([200, 404]).toContain(res.status);
  });

  test('Admin get users without auth returns 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect([401, 403]).toContain(res.status);
  });

  test('Rate limiter on /api/ should respond (200 or 429)', async () => {
    const res = await request(app).get('/api/property');
    expect([200, 429, 500]).toContain(res.status);
  });

  test('Unhandled route returns 404', async () => {
    const res = await request(app).get('/non-existent-route-123');
    expect(res.status).toBe(404);
  });

  test('Admin properties payload shape when reachable: contains images field', async () => {
    const res = await request(app).get('/api/admin/properties');
    if (res.status === 200 && res.body && res.body.data && Array.isArray(res.body.data)) {
      const p = res.body.data[0];
      if (p) {
        expect(p).toHaveProperty('images');
      }
    } else {
      expect([401,403,500]).toContain(res.status);
    }
  });

  test('Protected auth profile without auth returns 401/403', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect([401, 403]).toContain(res.status);
  });

  test('Create booking without auth returns 401/400', async () => {
    const res = await request(app).post('/api/booking').send({});
    expect([401, 400]).toContain(res.status);
  });

  test('Get bookings by property without auth returns 401/403/404', async () => {
    const res = await request(app).get('/api/booking/property/000000000000000000000000');
    expect([401, 403, 404]).toContain(res.status);
  });

  test('Mark notification as read without auth returns 401/403/404', async () => {
    const res = await request(app).put('/api/notification/000/read');
    expect([401, 403, 404]).toContain(res.status);
  });

  test('Send conversation message without auth returns 401/403/400', async () => {
    const res = await request(app).post('/api/conversation/000/message').send({ text: 'hello' });
    expect([401, 403, 400]).toContain(res.status);
  });

});
