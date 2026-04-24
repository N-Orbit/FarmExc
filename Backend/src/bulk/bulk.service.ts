import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BulkProjectsRequestDto, BulkContributionsRequestDto, BulkOperationResponseDto } from './dto/bulk.dto';
import { StructuredLoggerService } from '../logging/services/structured-logger.service';

@Injectable()
export class BulkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async bulkCreateProjects(data: BulkProjectsRequestDto): Promise<BulkOperationResponseDto> {
    const results = {
      success: true,
      processedCount: 0,
      errors: [],
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const project of data.projects) {
          try {
            await tx.project.create({
              data: {
                ...project,
                goal: BigInt(project.goal),
              },
            });
            results.processedCount++;
          } catch (error) {
            results.errors.push({ project: project.contractId, error: error.message });
            throw error; // Rollback entire transaction on any failure as per requirement "transaction-based"
          }
        }
      });
    } catch (error) {
      results.success = false;
      this.logger.error('Bulk project creation failed', error.stack, 'BulkService');
    }

    return results;
  }

  async bulkCreateContributions(data: BulkContributionsRequestDto): Promise<BulkOperationResponseDto> {
    const results = {
      success: true,
      processedCount: 0,
      errors: [],
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const contribution of data.contributions) {
          try {
            await tx.contribution.create({
              data: {
                ...contribution,
                amount: BigInt(contribution.amount),
              },
            });
            results.processedCount++;
          } catch (error) {
            results.errors.push({ contribution: contribution.transactionHash, error: error.message });
            throw error;
          }
        }
      });
    } catch (error) {
      results.success = false;
      this.logger.error('Bulk contribution creation failed', error.stack, 'BulkService');
    }

    return results;
  }
}
