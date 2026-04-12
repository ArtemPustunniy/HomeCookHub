import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'Ivan' })
  @IsString()
  @MinLength(1)
  name!: string

  @ApiProperty({ example: 'ivan@mail.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'secret12', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string
}
