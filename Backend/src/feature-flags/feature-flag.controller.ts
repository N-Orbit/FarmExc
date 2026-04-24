import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { Role } from '@prisma/client';

@ApiTags('feature-flags')
@ApiBearerAuth('JWT-auth')
@Controller('feature-flags')
// @UseGuards(RolesGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag' })
  // @Roles(Role.SUPER_ADMIN)
  async create(@Body() data: { name: string; description?: string; enabled?: boolean; rules?: any }) {
    return this.featureFlagService.createFlag(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  async findAll() {
    return this.featureFlagService.getAllFlags();
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a feature flag' })
  // @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('name') name: string,
    @Body() data: { enabled?: boolean; rules?: any; description?: string },
  ) {
    return this.featureFlagService.updateFlag(name, data);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh flags from database' })
  // @Roles(Role.SUPER_ADMIN)
  async refresh() {
    await this.featureFlagService.refreshFlags();
    return { message: 'Flags refreshed successfully' };
  }
}
