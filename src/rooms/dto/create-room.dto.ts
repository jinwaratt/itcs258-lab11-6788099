import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({ example: 'Standard Room 101', description: 'Full name of the room' })
    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'Standard room with garden view', description: 'Full description of the room' })
    description!: string;

    @ApiProperty({ example: '2', description: 'Capacity of the room' })
    @IsNotEmpty()
    capacity!: number;

    @ApiProperty({ example: '1800.00', description: 'Price per night of the room' })
    @IsNotEmpty()
    price_per_night!: number;

    @ApiProperty({ example: '/images/room101.jpg', description: 'Image URL of the room' })
    @IsString()
    @IsOptional()
    image_url!: string;

    @ApiProperty({ example: 'TRUE', description: 'Status of the room' })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
