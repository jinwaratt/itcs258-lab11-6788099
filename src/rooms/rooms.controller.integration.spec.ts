import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto'; 
import { NotFoundException, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UpdateRoomDto } from './dto/update-room.dto';

// Mock RoomsService
// The controller interacts with this mock instead of the real service/DB.
const mockRoomsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findARoom: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
};

describe('RoomsController Integration', () => {
  let controller: RoomsController;
  let service: RoomsService;

  beforeEach(async () => {
    // We override Guards and Interceptors to isolate the controller.
    // 1. JwtAuthGuard & RolesGuard: overridden to allow all requests (return true).
    // 2. CacheInterceptor: overridden to bypass caching logic.
  jest.clearAllMocks();

  const module: TestingModule = await Test.createTestingModule({
    controllers: [RoomsController],
    providers: [
      {
        provide: RoomsService,
        useValue: mockRoomsService,
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .overrideInterceptor(CacheInterceptor)
    .useValue({
      intercept: (ctx: ExecutionContext, next: any) => next.handle(),
    })
    .compile();

  controller = module.get<RoomsController>(RoomsController);
  service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test Suite: CREATE
  // Verifies the controller delegates to service.create and returns the result.
  describe('create', () => {
    it('should create a room', async () => {
      const dto: CreateRoomDto = {
      name: 'Standard Room 101',
      description: 'Standard room with garden view',
      capacity: 2,
      price_per_night: 1800,
      image_url: '/images/room101.jpg',
      is_active: true,
      };

      const result = { id: 1, ...dto };

      mockRoomsService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  // FIND ALL
  describe('findAll', () => {
    it('should return all rooms', async () => {
      const result = [{ id: 1 }, { id: 2 }];

        mockRoomsService.findAll.mockResolvedValue(result);

        expect(await controller.findAll()).toBe(result);
        expect(service.findAll).toHaveBeenCalledTimes(1);
      });

  });

  // Test Suite: FIND ONE
  // Verifies:
  // 1. Success: Returns room found by service.
  // 2. Failure: Returns null if service returns null.
  describe('findARoom', () => {
    it('should return a room by ID', async () => {
      const result = { id: 1, name: 'Standard Room 101' };

        mockRoomsService.findARoom.mockResolvedValue(result);

        expect(await controller.findOne('1')).toBe(result);
        expect(service.findARoom).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomsService.findARoom.mockRejectedValue(
        new NotFoundException('Room 999 not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.findARoom).toHaveBeenCalledWith(999);
    });

  });

  // UPDATE
  describe('update', () => {
    it('should update a room', async () => {
      const dto: UpdateRoomDto = {
      name: 'Updated Room',
      price_per_night: 2000,
      };

        const result = { id: 1, ...dto };

        mockRoomsService.update.mockResolvedValue(result);

        expect(await controller.update('1', dto)).toBe(result);
        expect(service.update).toHaveBeenCalledWith(1, dto);
    });

  });

  // ENABLE
  describe('enable', () => {
    it('should enable a room', async () => {
      const result = { id: 1, is_active: true };

        mockRoomsService.enable.mockResolvedValue(result);

        expect(await controller.enable('1')).toBe(result);
        expect(service.enable).toHaveBeenCalledWith(1);
    });

  });

  // DISABLE
  describe('disable', () => {
    it('should disable a room', async () => {
      const result = { id: 1, is_active: false };

        mockRoomsService.disable.mockResolvedValue(result);

        expect(await controller.disable('1')).toBe(result);
        expect(service.disable).toHaveBeenCalledWith(1);
    });

  });

  // DELETE
  describe('remove', () => {
    it('should delete a room', async () => {
      const result = { id: 1, name: 'Standard Room 101' };

        mockRoomsService.remove.mockResolvedValue(result);

        expect(await controller.remove('1')).toBe(result);
        expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomsService.remove.mockRejectedValue(
        new NotFoundException('Room 999 not found'),
      );

      await expect(controller.remove('999')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.remove).toHaveBeenCalledWith(999);
    });

  });

});
