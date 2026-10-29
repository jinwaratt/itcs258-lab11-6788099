import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';


export class CreateUserDto {
    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    email!: string;

    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    password!: string;

    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    name!: string;

    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    role!: string;
}
