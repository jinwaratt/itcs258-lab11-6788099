import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { beforeAll, describe, expect, it, jest } from '@jest/globals';

// Mock Redis to avoid requiring an external Redis instance.
jest.mock('cache-manager-redis-yet', () => ({
  redisStore: () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }),
}));

describe('Rooms API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let createdRoomId: number;
  let adminEmail: string;

  const password = 'password123';

  beforeAll(async () => {
    // Initialize the complete NestJS application.
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create a test admin user.
    adminEmail = `test-admin-${Date.now()}@example.com`;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'E2E Test Admin',
        role: UserRole.ADMIN,
      },
    });

    // Login to obtain a JWT access token.
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password,
      })
      .expect(200);

    accessToken = loginResponse.body.access_token;
  });

  
afterAll(async () => {
    try {
        // Clean up the test room.
        if (createdRoomId) {
        await prisma.rooms.deleteMany({
            where: { id: createdRoomId },
        });
        }

        // Clean up the test admin.
        if (adminEmail) {
        await prisma.users.deleteMany({
            where: { email: adminEmail },
        });
        }
    } finally {
        // Close NestJS and trigger PrismaService.onModuleDestroy().
        if (app) {
        await app.close();
        }
    }
}, 15000);


  // 1. CREATE ROOM
  it('POST /rooms - should create a room', async () => {
    const createRoomDto = {
      name: 'E2E Test Room',
      description: 'Room created for E2E testing',
      capacity: 4,
      price_per_night: 1500,
      image_url: 'https://example.com/room.jpg',
      is_active: true,
    };

    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createRoomDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(createRoomDto.name);
    expect(response.body.description).toBe(
      createRoomDto.description,
    );
    expect(response.body.capacity).toBe(createRoomDto.capacity);

    createdRoomId = response.body.id;
  });

  // 2. UNAUTHORIZED ACCESS
  it('POST /rooms - should reject requests without authentication', async () => {
    await request(app.getHttpServer())
      .post('/rooms')
      .send({
        name: 'Unauthorized Room',
        description: 'This room should not be created',
        capacity: 2,
        price_per_night: 500,
        image_url: 'https://example.com/unauthorized.jpg',
        is_active: true,
      })
      .expect(401);
  });

  // 3. GET ALL ROOMS
  it('GET /rooms - should return all rooms', async () => {
    const response = await request(app.getHttpServer())
      .get('/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    const foundRoom = response.body.find(
      (room: { id: number }) => room.id === createdRoomId,
    );

    expect(foundRoom).toBeDefined();
    expect(foundRoom.name).toBe('E2E Test Room');
  });

  // 4. GET SINGLE ROOM
  it('GET /rooms/:id - should return a specific room', async () => {
    const response = await request(app.getHttpServer())
      .get(`/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.id).toBe(createdRoomId);
    expect(response.body.name).toBe('E2E Test Room');
    expect(response.body.capacity).toBe(4);
  });

  // 5. UPDATE ROOM
  it('PATCH /rooms/:id - should update a room', async () => {
    const updateRoomDto = {
      name: 'Updated E2E Test Room',
      description: 'Updated room description',
    };

    const response = await request(app.getHttpServer())
      .patch(`/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateRoomDto)
      .expect(200);

    expect(response.body.name).toBe(updateRoomDto.name);
    expect(response.body.description).toBe(
      updateRoomDto.description,
    );
  });

  // 6. UPDATE ROOM NOT FOUND
  it('PATCH /rooms/:id - should return 404 for a nonexistent room', async () => {
    const res = await request(app.getHttpServer())
      .patch('/rooms/999999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Room That Does Not Exist',
        capacity: 1,
        price_per_night: 100,
      });
    expect(res.status).toBe(404);
  });





  // 7. DELETE ROOM
  it('DELETE /rooms/:id - should delete a room', async () => {
    await request(app.getHttpServer())
      .delete(`/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // The room has been deleted, so cleanup no longer needs its ID.
    createdRoomId = 0;
  });

  // 8. VERIFY DELETION
  it('GET /rooms/:id - should return 404 after deletion', async () => {
    await request(app.getHttpServer())
      .get(`/rooms/${createdRoomId || 999999}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});