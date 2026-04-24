import { Module } from '@nestjs/common';
import { BulkService } from './bulk.service';
import { BulkController } from './bulk.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BulkController],
  providers: [BulkService, PrismaService],
  exports: [BulkService],
})
export class BulkModule {}
