import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get(':userId')
  async getReputation(@Param('userId') userId: string) {
    return this.reputationService.getReputation(userId);
  }

  @Get('proof/:userId')
  async getProof(
    @Param('userId') userId: string,
    @Query('threshold') thresholdStr: string,
  ) {
    const threshold = parseFloat(thresholdStr);
    if (isNaN(threshold)) {
      throw new Error('Invalid threshold');
    }
    return this.reputationService.generateProof(userId, threshold);
  }

  @Post('endorse')
  async endorseUser(
    @Body() body: { endorserId: string; endorsedId: string; weight: number; context?: string }
  ) {
    return this.reputationService.endorseUser(
      body.endorserId,
      body.endorsedId,
      body.weight,
      body.context
    );
  }

  @Post('dispute')
  async fileDispute(
    @Body() body: { disputerId: string; disputedId: string; reason: string; referenceId?: string }
  ) {
    return this.reputationService.fileDispute(
      body.disputerId,
      body.disputedId,
      body.reason,
      body.referenceId
    );
  }
}
