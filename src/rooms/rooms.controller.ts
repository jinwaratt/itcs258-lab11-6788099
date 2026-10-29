import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, NotFoundException} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decarators/roles.decorator';
import { Role, UserRole } from '@prisma/client';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('rooms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // Cache for 30 seconds
  @Get()
  @ApiOperation({ summary: 'Retrieve all rooms' })
  @ApiResponse({ status: 200, description: 'List of all rooms', type: [CreateRoomDto] })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  findAll() {
    return this.roomsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific room by ID' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room details', type: CreateRoomDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findARoom(+id);
    if (!room) {
      throw new NotFoundException(`Term with ID ${id} not found`);
    }
    return room;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/disable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Disable a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room disabled successfully', type: CreateRoomDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  disable(@Param('id') id: number) {
    return this.roomsService.disable(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/enable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room enabled successfully', type: CreateRoomDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  enable(@Param('id') id: number) {
    return this.roomsService.enable(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a Room' })
  @ApiParam({ name: 'id', description: 'Term ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room updated successfully', type: CreateRoomDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    try {
      return await this.roomsService.update(+id, updateRoomDto);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Room with ID ${id} not found`);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully', type: CreateRoomDto }) // Returns the created object, conceptually matches DTO structure usually
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async remove(@Param('id') id: string) {
    try {
      return await this.roomsService.remove(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }
}
