/*
AI Declaration:
No Generative AI tools were used for this lab.
All code was written manually by the student.

Reflection:
[ Your Reflection goes here
Today’s lab helped me learn [key takeaway].
I practiced how to handle unexpected input
]
*/

import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger('RoomsService');

  async findAll() {
    this.logger.log(`Fetching all rooms`);
    return await this.prisma.rooms.findMany();
  }

  async findARoom(id: number) {
    this.logger.log(`Fetching room id=${id}`);
    const room = await this.prisma.rooms.findUnique({where: {id}});
    if(!room) {
      this.logger.warn(`Room ${id} not found!`);
      throw new NotFoundException(`Room ${id} not found`);
    }
    return room;
  }

  async disable(id: number) {
    this.logger.log(`Disabling room id=${id}`);
    await this.findARoom(id);
    
    return this.prisma.rooms.update({
      where: {id},
      data: {is_active: false}
    });
  }

  async enable(id: number) {
    this.logger.log(`Enabling room id=${id}`);
    await this.findARoom(id);
    
    return this.prisma.rooms.update({
      where: {id},
      data: {is_active: true}
    });
  }

  async create(dto: CreateRoomDto) {
    this.logger.log(`Creating room: ${dto.name}`);
    try {
      return await this.prisma.rooms.create({
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        price_per_night: dto.price_per_night,
        image_url: dto.image_url,
        is_active: dto.is_active ?? true,
      },
    });
    } catch (e: any) {
        throw new BadRequestException('Bad Request');
      }
    
  }

  async update(id: number, dto: UpdateRoomDto) {
      this.logger.log(`Updating room #${id}`);
      return await this.prisma.rooms.update({
        where: { id: Number(id) }, 
        data: {
          name: dto.name,
          description: dto.description,
          capacity: dto.capacity,
          price_per_night: dto.price_per_night,
          image_url: dto.image_url,
          is_active: dto.is_active ?? true,
        },        
      });
    }


  async remove(id: number) {
    this.logger.log(`Deleting room #${id}`);
    await this.findARoom(id);
    try {
      return await this.prisma.rooms.delete({
        where: { id },
      });
    } catch (e: any) {
      throw new NotFoundException(`Room ${id} not found`);
    }
  }
}
