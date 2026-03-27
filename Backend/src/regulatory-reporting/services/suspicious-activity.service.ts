import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegulatoryReportType, RegulatoryBody } from '@prisma/client';

@Injectable()
export class SuspiciousActivityService {
  private readonly logger = new Logger(SuspiciousActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateSar(suspiciousActivityIds: string[], reason: string) {
    this.logger.log(`Generating SAR for ${suspiciousActivityIds.length} activities`);

    // Get suspicious activities
    const activities = await this.prisma.regulatoryTransaction.findMany({
      where: {
        id: { in: suspiciousActivityIds },
        isSuspicious: true,
      },
    });

    if (activities.length === 0) {
      throw new Error('No suspicious activities found for the provided IDs');
    }

    // Create SAR report
    const report = await this.prisma.regulatoryReport.create({
      data: {
        reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'PENDING',
        reportPeriod: new Date().toISOString().slice(0, 7), // Current month
        reportData: {
          suspiciousActivities: activities.length,
          reason,
          patterns: this.analyzeSuspiciousPatterns(activities),
          riskAssessment: this.assessOverallRisk(activities),
          recommendations: this.generateRecommendations(activities),
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          activityIds: suspiciousActivityIds,
          reason,
        },
      },
    });

    // Link activities to report
    await this.prisma.regulatoryTransaction.updateMany({
      where: { id: { in: suspiciousActivityIds } },
      data: { reportId: report.id },
    });

    this.logger.log(`SAR generated: ${report.id} for ${activities.length} activities`);

    return {
      report,
      activities: activities.length,
      summary: {
        reportId: report.id,
        suspiciousActivities: activities.length,
        reason,
        riskLevel: this.assessOverallRisk(activities).level,
      },
    };
  }

  async getSuspiciousActivities(query: any) {
    const where: any = { isSuspicious: true };

    if (query.riskScoreMin) {
      where.riskScore = { gte: parseFloat(query.riskScoreMin) };
    }

    if (query.transactionType) {
      where.transactionType = query.transactionType;
    }

    if (query.period) {
      const startDate = this.getPeriodStartDate(query.period);
      const endDate = this.getPeriodEndDate(query.period);
      where.timestamp = { gte: startDate, lt: endDate };
    }

    const [activities, total] = await Promise.all([
      this.prisma.regulatoryTransaction.findMany({
        where,
        orderBy: { riskScore: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
      }),
      this.prisma.regulatoryTransaction.count({ where }),
    ]);

    return { activities, total, limit: query.limit || 100, offset: query.offset || 0 };
  }

  async detectSuspiciousPatterns() {
    this.logger.log('Detecting suspicious patterns');

    const patterns = await Promise.all([
      this.detectHighFrequencyTrading(),
      this.detectUnusualAmounts(),
      this.detectCircularTransactions(),
      this.detectMixingPatterns(),
      this.detectTimingAnomalies(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      patterns: patterns.filter(p => p.detected),
      summary: {
        totalPatterns: patterns.filter(p => p.detected).length,
        highRiskActivities: patterns.reduce((sum, p) => sum + (p.count || 0), 0),
      },
    };
  }

  private async detectHighFrequencyTrading() {
    // Detect same address making many trades in short time
    const recentTransactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const addressCounts = new Map<string, number>();
    recentTransactions.forEach(t => {
      const count = addressCounts.get(t.fromAddress) || 0;
      addressCounts.set(t.fromAddress, count + 1);
    });

    const suspiciousAddresses = Array.from(addressCounts.entries())
      .filter(([_, count]) => count > 100) // More than 100 transactions in 24h
      .map(([address, count]) => ({ address, count }));

    return {
      type: 'HIGH_FREQUENCY_TRADING',
      detected: suspiciousAddresses.length > 0,
      count: suspiciousAddresses.length,
      details: suspiciousAddresses,
    };
  }

  private async detectUnusualAmounts() {
    // Detect transactions with unusually high amounts for the asset
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const assetStats = new Map<string, { amounts: number[]; avg: number; stdDev: number }>();

    // Calculate statistics per asset
    transactions.forEach(t => {
      const amount = Number(t.amount);
      const stats = assetStats.get(t.asset) || { amounts: [], avg: 0, stdDev: 0 };
      stats.amounts.push(amount);
      assetStats.set(t.asset, stats);
    });

    // Calculate average and standard deviation
    assetStats.forEach((stats, asset) => {
      const avg = stats.amounts.reduce((sum, a) => sum + a, 0) / stats.amounts.length;
      const variance = stats.amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / stats.amounts.length;
      stats.avg = avg;
      stats.stdDev = Math.sqrt(variance);
    });

    // Find unusual transactions (more than 3 standard deviations from mean)
    const unusualTransactions = transactions.filter(t => {
      const stats = assetStats.get(t.asset);
      if (!stats || stats.stdDev === 0) return false;
      const amount = Number(t.amount);
      return Math.abs(amount - stats.avg) > 3 * stats.stdDev;
    });

    return {
      type: 'UNUSUAL_AMOUNTS',
      detected: unusualTransactions.length > 0,
      count: unusualTransactions.length,
      details: unusualTransactions.map(t => ({
        transactionHash: t.transactionHash,
        asset: t.asset,
        amount: t.amount,
        avgAmount: assetStats.get(t.asset)?.avg,
        deviation: Math.abs(Number(t.amount) - (assetStats.get(t.asset)?.avg || 0)),
      })),
    };
  }

  private async detectCircularTransactions() {
    // Detect A -> B -> A patterns
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const circularPatterns = new Map<string, any[]>();

    transactions.forEach(t => {
      const key = `${t.fromAddress}-${t.toAddress}`;
      const reverseKey = `${t.toAddress}-${t.fromAddress}`;
      
      if (circularPatterns.has(reverseKey)) {
        // Found circular pattern
        circularPatterns.get(reverseKey).push(t);
      } else {
        circularPatterns.set(key, [t]);
      }
    });

    const detectedCircles = Array.from(circularPatterns.entries())
      .filter(([_, txs]) => txs.length >= 2)
      .map(([key, txs]) => ({
        addresses: key.split('-'),
        transactions: txs,
      }));

    return {
      type: 'CIRCULAR_TRANSACTIONS',
      detected: detectedCircles.length > 0,
      count: detectedCircles.length,
      details: detectedCircles,
    };
  }

  private async detectMixingPatterns() {
    // Detect potential mixing services (many small inputs, few large outputs)
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const addressActivity = new Map<string, { inputs: number; outputs: number; totalIn: number; totalOut: number }>();

    transactions.forEach(t => {
      // Track inputs
      const inputStats = addressActivity.get(t.fromAddress) || { inputs: 0, outputs: 0, totalIn: 0, totalOut: 0 };
      inputStats.inputs++;
      inputStats.totalIn += Number(t.amount);
      addressActivity.set(t.fromAddress, inputStats);

      // Track outputs
      const outputStats = addressActivity.get(t.toAddress) || { inputs: 0, outputs: 0, totalIn: 0, totalOut: 0 };
      outputStats.outputs++;
      outputStats.totalOut += Number(t.amount);
      addressActivity.set(t.toAddress, outputStats);
    });

    // Identify potential mixers (many inputs, few outputs, large volume)
    const potentialMixers = Array.from(addressActivity.entries())
      .filter(([_, stats]) => 
        stats.inputs > 10 && 
        stats.outputs < 5 && 
        stats.totalIn > 1000000
      )
      .map(([address, stats]) => ({ address, ...stats }));

    return {
      type: 'MIXING_PATTERNS',
      detected: potentialMixers.length > 0,
      count: potentialMixers.length,
      details: potentialMixers,
    };
  }

  private async detectTimingAnomalies() {
    // Detect transactions at unusual times (e.g., 3-5 AM)
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const unusualHours = transactions.filter(t => {
      const hour = t.timestamp.getHours();
      return hour >= 3 && hour <= 5; // 3-5 AM
    });

    return {
      type: 'TIMING_ANOMALIES',
      detected: unusualHours.length > transactions.length * 0.1, // More than 10% in unusual hours
      count: unusualHours.length,
      percentage: (unusualHours.length / transactions.length) * 100,
      details: unusualHours.map(t => ({
        transactionHash: t.transactionHash,
        timestamp: t.timestamp,
        hour: t.timestamp.getHours(),
      })),
    };
  }

  private analyzeSuspiciousPatterns(activities: any[]) {
    const patterns = {
      highFrequency: activities.filter((_, i) => i > 0 && 
        activities[i].timestamp.getTime() - activities[i-1].timestamp.getTime() < 60000
      ).length,
      largeAmounts: activities.filter(t => Number(t.amount) > 100000).length,
      multipleAssets: new Set(activities.map(t => t.asset)).size > 2,
      circularPatterns: this.detectCircularPatternsInActivities(activities),
    };

    return patterns;
  }

  private detectCircularPatternsInActivities(activities: any[]) {
    const addressPairs = new Set();
    let circularCount = 0;

    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const t1 = activities[i];
        const t2 = activities[j];
        
        if (t1.fromAddress === t2.toAddress && t1.toAddress === t2.fromAddress) {
          circularCount++;
        }
      }
    }

    return circularCount;
  }

  private assessOverallRisk(activities: any[]) {
    const avgRiskScore = activities.reduce((sum, t) => sum + (t.riskScore || 0), 0) / activities.length;
    const maxRiskScore = Math.max(...activities.map(t => t.riskScore || 0));
    const suspiciousCount = activities.filter(t => t.isSuspicious).length;

    let level = 'LOW';
    if (avgRiskScore > 0.7 || maxRiskScore > 0.9 || suspiciousCount > activities.length * 0.5) {
      level = 'HIGH';
    } else if (avgRiskScore > 0.4 || maxRiskScore > 0.6 || suspiciousCount > activities.length * 0.25) {
      level = 'MEDIUM';
    }

    return {
      level,
      avgRiskScore,
      maxRiskScore,
      suspiciousCount,
      totalActivities: activities.length,
    };
  }

  private generateRecommendations(activities: any[]) {
    const recommendations = [];

    const highRiskActivities = activities.filter(t => (t.riskScore || 0) > 0.7);
    if (highRiskActivities.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'IMMEDIATE_REVIEW',
        description: `${highRiskActivities.length} high-risk activities require immediate review`,
        activityIds: highRiskActivities.map(t => t.id),
      });
    }

    const circularPatterns = this.detectCircularPatternsInActivities(activities);
    if (circularPatterns > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'INVESTIGATE_CIRCULAR',
        description: `${circularPatterns} circular transaction patterns detected`,
      });
    }

    const frequentTraders = this.identifyFrequentTraders(activities);
    if (frequentTraders.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'MONITOR_FREQUENCY',
        description: `${frequentTraders.length} addresses showing high-frequency trading`,
        addresses: frequentTraders,
      });
    }

    return recommendations;
  }

  private identifyFrequentTraders(activities: any[]) {
    const addressCounts = new Map<string, number>();
    activities.forEach(t => {
      const count = addressCounts.get(t.fromAddress) || 0;
      addressCounts.set(t.fromAddress, count + 1);
    });

    return Array.from(addressCounts.entries())
      .filter(([_, count]) => count > 5)
      .map(([address]) => address);
  }

  private getPeriodStartDate(period: string): Date {
    if (period.includes('-Q')) {
      const [year, quarter] = period.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      return new Date(parseInt(year), quarterStartMonth, 1);
    } else if (period.length === 7) {
      return new Date(period + '-01');
    }
    return new Date(period);
  }

  private getPeriodEndDate(period: string): Date {
    const startDate = this.getPeriodStartDate(period);
    
    if (period.includes('-Q')) {
      return new Date(startDate.getFullYear(), startDate.getMonth() + 3, 1);
    } else if (period.length === 7) {
      return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    }
    
    return new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  }
}
