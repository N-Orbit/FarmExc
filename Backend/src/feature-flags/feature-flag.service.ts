import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FeatureFlag, FeatureFlagAnalytics } from '@prisma/client';
import { StructuredLoggerService } from '../logging/services/structured-logger.service';

@Injectable()
export class FeatureFlagService implements OnModuleInit {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async onModuleInit() {
    await this.refreshFlags();
  }

  async refreshFlags() {
    const flags = await this.prisma.featureFlag.findMany();
    this.flags.clear();
    flags.forEach((flag) => this.flags.set(flag.name, flag));
    this.logger.log(`Loaded ${flags.length} feature flags`, 'FeatureFlagService');
  }

  async isEnabled(flagName: string, userId?: string, context?: any): Promise<boolean> {
    const flag = this.flags.get(flagName);
    if (!flag) return false;

    let enabled = flag.enabled;

    if (enabled && flag.rules) {
      enabled = this.evaluateRules(flag.rules, userId, context);
    }

    // Track analytics
    await this.trackAnalytics(flagName, userId, enabled ? 'CHECK_ENABLED' : 'CHECK_DISABLED', context);

    return enabled;
  }

  private evaluateRules(rules: any, userId?: string, context?: any): boolean {
    // Simple rule evaluation
    if (rules.userIds && userId) {
      if (Array.isArray(rules.userIds) && rules.userIds.includes(userId)) {
        return true;
      }
    }

    if (rules.percentage && userId) {
      // Deterministic percentage rollout
      const hash = this.hashCode(userId);
      return hash % 100 < rules.percentage;
    }

    // Default to true if flag is enabled and no specific rules block it
    // Or customize based on requirements
    return true;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private async trackAnalytics(flagName: string, userId: string | undefined, action: string, metadata?: any) {
    try {
      await this.prisma.featureFlagAnalytics.create({
        data: {
          flagName,
          userId,
          action,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track feature flag analytics for ${flagName}`, error.stack, 'FeatureFlagService');
    }
  }

  async createFlag(data: { name: string; description?: string; enabled?: boolean; rules?: any }) {
    const flag = await this.prisma.featureFlag.create({ data });
    this.flags.set(flag.name, flag);
    return flag;
  }

  async updateFlag(name: string, data: { enabled?: boolean; rules?: any; description?: string }) {
    const flag = await this.prisma.featureFlag.update({
      where: { name },
      data,
    });
    this.flags.set(flag.name, flag);
    return flag;
  }

  async getAllFlags() {
    return Array.from(this.flags.values());
  }
}
