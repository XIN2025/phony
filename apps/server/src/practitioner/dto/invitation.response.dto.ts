import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@repo/db';

export class InvitationResponseDto {
  @ApiProperty({ description: 'The ID of the invitation.' })
  id: string;

  @ApiProperty({ description: "The client's email address." })
  clientEmail: string;

  @ApiProperty({ description: "The client's first name." })
  clientFirstName: string;

  @ApiProperty({ description: "The client's last name." })
  clientLastName: string;

  @ApiProperty({
    description: 'The status of the invitation.',
    enum: ['PENDING', 'JOINED'],
  })
  status: 'PENDING' | 'JOINED';

  @ApiProperty({ description: 'The date the invitation was sent.' })
  invited?: string;

  @ApiProperty({ description: "URL of the client's avatar." })
  avatar?: string;

  @ApiProperty({ description: 'The creation date of the invitation.' })
  createdAt: Date;
}
