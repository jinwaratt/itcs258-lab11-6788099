/*
AI Declaration:
I used Gemini to help debug the code because the server cannot find the Role when importing, so Gemini suggest me to restart 
the TS server. Also, I didn't understand about the model Role. So, I ask it to explain to me. 

Reflection:
Gemini help me understand the structured of the files easier and be able to know what should do next.
*/

import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger('UsersService');

  async create(dto: CreateUserDto) {
      this.logger.log(`Creating user: ${dto.name}`);
      try {
        return await this.prisma.users.create({
        data: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },
      });
      } catch (e: any) {
          throw new BadRequestException('Bad Request');
        }
      
    }

  async findAll() {
    this.logger.log(`Fetching all users`);
    return await this.prisma.users.findMany();
  }

  async findAUser(id: number) {
    this.logger.log(`Fetching user id=${id}`);
    const user = await this.prisma.users.findUnique({where: {id}});
    if(!user) {
      this.logger.warn(`User ${id} not found!`);
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    this.logger.log(`Updating user #${id}`);
    try {
      return await this.prisma.users.update({
        where: { id: Number(id) }, 
        data: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },        
      });
    } catch (e: any) {
      throw new BadRequestException('Failed to update user');
    }
  }

}
