import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';
import { generateToken } from '../src/services/jwt';

// Mock WhatsApp sending to avoid external calls
vi.mock('../src/services/whatsapp', () => ({
  sendWhatsAppCode: async () => true,
}));

describe('API endpoints', () => {
  const testPhone = '+255700000001';
  let authToken: string;

  beforeAll(async () => {
    // Clean relevant tables
    await prisma.payment.deleteMany({});
    await prisma.invitationGuest.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.guest.deleteMany({});
    await prisma.cardDesign.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed a user and a design
    const user = await prisma.user.create({
      data: {
        phoneNumber: testPhone,
      },
    });

    await prisma.cardDesign.create({
      data: {
        id: 'test-design',
        name: 'Test Design',
        thumbnailUrl: '/thumb.png',
        templateUrl: '/template.png',
      },
    });

    authToken = generateToken({ userId: user.id, phoneNumber: user.phoneNumber });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('auth: request code', async () => {
    const res = await request(app)
      .post('/api/auth/request-code')
      .send({ phoneNumber: testPhone });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('auth: verify code fails with wrong code', async () => {
    const res = await request(app)
      .post('/api/auth/verify-code')
      .send({ phoneNumber: testPhone, code: '000000' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('guests: create/list/update/delete', async () => {
    // Create
    let res = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Guest A', mobile: '+255712345678', type: 'Single' });
    expect(res.status).toBe(201);
    const guestId = res.body.data.id;

    // List
    res = await request(app)
      .get('/api/guests')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    // Update
    res = await request(app)
      .put(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Guest A Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Guest A Updated');

    // Delete
    res = await request(app)
      .delete(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
  });

  it('card designs: list', async () => {
    const res = await request(app)
      .get('/api/card-designs')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

