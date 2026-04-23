import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
