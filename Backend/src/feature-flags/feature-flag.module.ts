import { Module, Global } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagController } from './feature-flag.controller';
import { FeatureFlagGuard } from './feature-flag.guard';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGuard, PrismaService],
  exports: [FeatureFlagService, FeatureFlagGuard],
})
export class FeatureFlagModule {}
