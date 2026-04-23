import { Module } from '@nestjs/common';
import { NlpController } from './nlp.controller';
import { NlpService } from './nlp.service';
import { LlmService } from './llm.service';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NlpController],
  providers: [NlpService, LlmService],
  exports: [NlpService],
})
export class NlpModule {}

