import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LlmService } from './llm.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';

// Optional: cache/memory store for context
const contextStore = new Map<string, string>();

@Injectable()
export class NlpService {
  private readonly logger = new Logger(NlpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async processQuery(dto: QueryRequestDto): Promise<QueryResponseDto> {
    const { question, contextId } = dto;
    let previousContext = '';

    if (contextId && contextStore.has(contextId)) {
      previousContext = contextStore.get(contextId);
    }

    // 1. Send to LLM to understand and generate SQL
    const analysis = await this.llmService.parseQueryToSql(question, previousContext);

    // Save context
    const newContextId = contextId || Math.random().toString(36).substring(7);
    contextStore.set(newContextId, question);

    if (analysis.type === 'clarification' || analysis.confidence < 0.7) {
      return {
        type: 'clarification',
        data: null,
        confidence: analysis.confidence,
        clarificationRequest: analysis.clarificationRequest || 'Could you please clarify your request?',
      };
    }

    // 2. Validate SQL
    if (!analysis.sql || !this.isSqlSafe(analysis.sql)) {
      throw new BadRequestException('Generated SQL is unsafe, modifies data, or is invalid.');
    }

    // Ensure it has a limit if not present (simple text check, though LLM is instructed)
    let finalSql = analysis.sql;
    if (!finalSql.toLowerCase().includes('limit')) {
      finalSql += ' LIMIT 100';
    }

    // 3. Execute Query
    let resultData: any;
    try {
      // NOTE: Use with caution! $queryRawUnsafe can execute arbitrary queries.
      // We rely on the isSqlSafe check to prevent drops/mutations.
      resultData = await this.prisma.$queryRawUnsafe(finalSql);
      
      // Convert BigInts to string so they can be JSON serialized
      resultData = this.serializeBigInt(resultData);
    } catch (e) {
      this.logger.error('Failed to execute generated SQL', e);
      throw new BadRequestException('Failed to execute query against database.');
    }

    // 4. Return Output
    return {
      type: analysis.type,
      data: resultData,
      sql: finalSql,
      confidence: analysis.confidence,
    };
  }

  private isSqlSafe(sql: string): boolean {
    const lowerSql = sql.toLowerCase().trim();
    // Must start with SELECT
    if (!lowerSql.startsWith('select')) {
      return false;
    }
    // Cannot contain mutating keywords outside of string literals (basic check)
    const mutatingPattern = /;\s*(drop|insert|update|delete|alter|grant|truncate|create|replace)\b/i;
    if (mutatingPattern.test(sql) || /\b(drop|insert|update|delete|alter|grant|truncate|create|replace)\b/.test(lowerSql)) {
      return false;
    }
    return true;
  }

  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((item) => this.serializeBigInt(item));
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.serializeBigInt(value);
      }
      return result;
    }
    return obj;
  }
}
