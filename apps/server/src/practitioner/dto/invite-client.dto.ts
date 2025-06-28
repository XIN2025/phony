import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteClientDto {
  @ApiProperty({
    description: "The client's first name.",
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  clientFirstName: string;

  @ApiProperty({
    description: "The client's last name.",
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  clientLastName: string;

  @ApiProperty({
    description: "The client's email address.",
    example: 'john.doe@example.com',
  })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({
    description: 'The ID of the intake form to be sent with the invitation.',
    example: '60c72b9f9b1d8e001f8e4c5e',
    required: false,
  })
  @IsString()
  @IsOptional()
  intakeFormId?: string;
}
