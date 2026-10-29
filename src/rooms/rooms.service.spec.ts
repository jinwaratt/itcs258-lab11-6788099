/*
AI Declaration:
I used Claude to help debug why the test is not passed and why it is error abou the path.
I wrote all the other code, and I understand the entire implementation.

Reflection:
AI explained how the test works to me.
*/

import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  rooms: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
  },
};

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  // In beforeEach, we use Test.createTestingModule to inject this mock into RoomsService. This isolates the service logic from the database layer.
  jest.clearAllMocks();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test Suite for creating a room
  // Verifies that:
  // 1. The service transforms DTO string dates into Date objects.
  // 2. It calls Prisma with the correct data structure.
  describe('create', () => {
    it('should create a room with provided dates', async () => {
      const dto: CreateRoomDto = {
        name: 'Standard Room 101',
        description: 'Standard room with garden view',
        capacity: 2,
        price_per_night: 1800.00,
        image_url: '/images/room101.jpg',
        is_active: true,
      };

      const result = {
        id: 1,
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.rooms.create.mockResolvedValue(result);

      expect(await service.create(dto)).toEqual(result);

      expect(prisma.rooms.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: dto.name,
          description: dto.description,
          capacity: dto.capacity,
          price_per_night: dto.price_per_night,
          image_url: dto.image_url,
          is_active: dto.is_active,
        }),
      });
    });
  });

  // Test Suite for retrieving all rooms
  // Verifies that the service simply delegates to prisma.rooma.findMany.
  describe('findAll', () => {
    it('should return an array of rooms', async () => {
      const result = [{ id: 1 }, { id: 2 }];
      mockPrismaService.rooms.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(prisma.rooms.findMany).toHaveBeenCalled();
    });
  });

  // Test Suite for retrieving a single room
  // Verifies:
  // 1. Success: Returns the room when found.
  // 2. Failure: Returns null when the ID does not exist.
  describe('findOne', () => {
    it('should return a single room', async () => {
        const result = { id: 1 , name: 'Standard Room 101' };
        mockPrismaService.rooms.findUnique.mockResolvedValue(result);
  
        expect(await service.findARoom(1)).toBe(result);
        expect(prisma.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if room not found', async () => {
        mockPrismaService.rooms.findUnique.mockResolvedValue(null);

        await expect(service.findARoom(999)).rejects.toThrow(NotFoundException,);
  
        expect(prisma.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  // Test Suite for updating a room
  // Verifies:
  // 1. Success: Calls prisma.update with correct ID and data.
  // 2. Failure: Throws an error if the record is not found (simulated rejection).
  describe('update', () => {
    it('should update a room', async () => {
      const dto: UpdateRoomDto = { name: 'Updated Name' };
      const result = { id: 1, name: 'Updated Name' };
      mockPrismaService.rooms.update.mockResolvedValue(result);

      expect(await service.update(1, dto)).toBe(result);
      expect(prisma.rooms.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ name: dto.name }),
      });
    });
    it('should throw if room not found', async () => {
      const dto: UpdateRoomDto = { name: 'Updated Name' };
      mockPrismaService.rooms.update.mockRejectedValue(new Error('Record to update not found.'));

      await expect(service.update(999, dto)).rejects.toThrow('Failed to update user');
    });
  });

  // Test Suite for enabling a room
  // Verifies:
  // 1. Success: Calls prisma.update with correct ID and data.
  // 2. Failure: Throws an error if the record is not found (simulated rejection).
  describe('enable', () => {
    it('should enable a room', async () => {
      const room = { id: 1, name: 'Standard Room 101', is_active: false };
      const result = { ...room, is_active: true };

      // The room must exist before it can be enabled.
      mockPrismaService.rooms.findUnique.mockResolvedValue(room);
      mockPrismaService.rooms.update.mockResolvedValue(result);

      expect(await service.enable(1)).toEqual(result);

      expect(prisma.rooms.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(prisma.rooms.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { is_active: true },
      });
    });
  });

  // Test Suite for disabling a room
  // Verifies:
  // 1. Success: Calls prisma.update with correct ID and data.
  // 2. Failure: Throws an error if the record is not found (simulated rejection).
  describe('disable', () => {
    it('should disable a room', async () => {
      const room = { id: 1, name: 'Standard Room 101', is_active: true };
      const result = { ...room, is_active: false };

      // The room must exist before it can be disabled.
      mockPrismaService.rooms.findUnique.mockResolvedValue(room);
      mockPrismaService.rooms.update.mockResolvedValue(result);

      expect(await service.disable(1)).toEqual(result);

      expect(prisma.rooms.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(prisma.rooms.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { is_active: false },
      });
    });
  });

  // Test Suite for removing a room
  // Verifies:
  // 1. Success: Calls prisma.delete with correct ID after confirming room exists.
  // 2. Failure: Throws NotFoundException if the room does not exist.
  describe('remove', () => {
    it('should delete a room', async () => {
      const room = { id: 1, name: 'Standard Room 101', is_active: true };

      // The room must exist before it can be deleted.
      mockPrismaService.rooms.findUnique.mockResolvedValue(room);
      mockPrismaService.rooms.delete.mockResolvedValue(room);

      expect(await service.remove(1)).toEqual(room);

      expect(prisma.rooms.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(prisma.rooms.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      mockPrismaService.rooms.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);

      expect(prisma.rooms.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

});