import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkProjectDto {
  @ApiProperty()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  goal: string; // BigInt as string

  @ApiProperty()
  deadline: Date;

  @ApiProperty()
  creatorId: string;
}

export class BulkProjectsRequestDto {
  @ApiProperty({ type: [BulkProjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkProjectDto)
  projects: BulkProjectDto[];
}

export class BulkContributionDto {
  @ApiProperty()
  @IsNotEmpty()
  transactionHash: string;

  @ApiProperty()
  @IsNotEmpty()
  investorId: string;

  @ApiProperty()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty()
  amount: string; // BigInt as string
}

export class BulkContributionsRequestDto {
  @ApiProperty({ type: [BulkContributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkContributionDto)
  contributions: BulkContributionDto[];
}

export class BulkOperationResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  processedCount: number;

  @ApiProperty({ required: false })
  errors?: any[];
}
