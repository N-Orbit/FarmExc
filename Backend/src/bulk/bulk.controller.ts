import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { BulkService } from './bulk.service';
import { BulkProjectsRequestDto, BulkContributionsRequestDto, BulkOperationResponseDto } from './dto/bulk.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequestLoggingInterceptor } from '../logging/interceptors/request-logging.interceptor';

@ApiTags('bulk-operations')
@ApiBearerAuth('JWT-auth')
@Controller('bulk')
@UseInterceptors(RequestLoggingInterceptor)
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('projects')
  @ApiOperation({ summary: 'Batch create or update projects' })
  @ApiResponse({ status: 201, type: BulkOperationResponseDto })
  async bulkProjects(@Body() data: BulkProjectsRequestDto): Promise<BulkOperationResponseDto> {
    return this.bulkService.bulkCreateProjects(data);
  }

  @Post('contributions')
  @ApiOperation({ summary: 'Batch create contributions' })
  @ApiResponse({ status: 201, type: BulkOperationResponseDto })
  async bulkContributions(@Body() data: BulkContributionsRequestDto): Promise<BulkOperationResponseDto> {
    return this.bulkService.bulkCreateContributions(data);
  }
}
