import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegulatoryReportType, RegulatoryBody } from '@prisma/client';

@Injectable()
export class ComplianceReportingService {
  private readonly logger = new Logger(ComplianceReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateComplianceReport(reportType: string, period: string) {
    this.logger.log(`Generating ${reportType} compliance report for period: ${period}`);

    const startDate = this.getPeriodStartDate(period);
    const endDate = this.getPeriodEndDate(period);

    switch (reportType.toUpperCase()) {
      case 'QUARTERLY':
        return this.generateQuarterlyReport(period, startDate, endDate);
      case 'ANNUAL':
        return this.generateAnnualReport(period, startDate, endDate);
      default:
        throw new Error(`Unsupported compliance report type: ${reportType}`);
    }
  }

  private async generateQuarterlyReport(period: string, startDate: Date, endDate: Date) {
    // Gather quarterly compliance data
    const [
      totalReports,
      tradeReports,
      sarReports,
      complianceReports,
      submittedReports,
      rejectedReports,
      auditLogs,
    ] = await Promise.all([
      this.prisma.regulatoryReport.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          reportType: RegulatoryReportType.TRADE_REPORT,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          reportType: RegulatoryReportType.QUARTERLY_COMPLIANCE,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          status: 'SUBMITTED',
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          status: 'REJECTED',
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryAuditTrail.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
    ]);

    const reportData = {
      period,
      quarter: this.extractQuarter(period),
      year: this.extractYear(period),
      summary: {
        totalReports,
        tradeReports,
        sarReports,
        complianceReports,
        submittedReports,
        rejectedReports,
        auditLogs,
        submissionRate: totalReports > 0 ? (submittedReports / totalReports) * 100 : 0,
        rejectionRate: totalReports > 0 ? (rejectedReports / totalReports) * 100 : 0,
      },
      regulatoryBodies: await this.getRegulatoryBodyStats(startDate, endDate),
      riskMetrics: await this.getRiskMetrics(startDate, endDate),
      complianceMetrics: await this.getComplianceMetrics(startDate, endDate),
      recommendations: await this.generateComplianceRecommendations(startDate, endDate),
    };

    const report = await this.prisma.regulatoryReport.create({
      data: {
        reportType: RegulatoryReportType.QUARTERLY_COMPLIANCE,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'PENDING',
        reportPeriod: period,
        reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'QUARTERLY_COMPLIANCE',
          period,
        },
      },
    });

    this.logger.log(`Quarterly compliance report generated: ${report.id}`);

    return { report, data: reportData };
  }

  private async generateAnnualReport(period: string, startDate: Date, endDate: Date) {
    // Gather annual compliance data
    const quarters = this.getQuartersInYear(period);
    const quarterlyData = [];

    for (const quarter of quarters) {
      const qStart = this.getPeriodStartDate(quarter);
      const qEnd = this.getPeriodEndDate(quarter);
      
      const [reports, sars, submissions] = await Promise.all([
        this.prisma.regulatoryReport.count({
          where: { createdAt: { gte: qStart, lt: qEnd } },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
            createdAt: { gte: qStart, lt: qEnd },
          },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            status: 'SUBMITTED',
            createdAt: { gte: qStart, lt: qEnd },
          },
        }),
      ]);

      quarterlyData.push({
        quarter,
        reports,
        sars,
        submissions,
      });
    }

    const annualStats = await this.getAnnualComplianceStats(startDate, endDate);
    const riskTrends = await this.getAnnualRiskTrends(startDate, endDate);

    const reportData = {
      period,
      year: this.extractYear(period),
      quarterlyData,
      annualStats,
      riskTrends,
      complianceScore: this.calculateAnnualComplianceScore(annualStats),
      keyMetrics: {
        totalReports: quarterlyData.reduce((sum, q) => sum + q.reports, 0),
        totalSars: quarterlyData.reduce((sum, q) => sum + q.sars, 0),
        totalSubmissions: quarterlyData.reduce((sum, q) => sum + q.submissions, 0),
        avgQuarterlyReports: quarterlyData.reduce((sum, q) => sum + q.reports, 0) / 4,
        peakQuarter: quarterlyData.reduce((max, q) => q.reports > max.reports ? q : max),
      },
      recommendations: await this.generateAnnualRecommendations(annualStats, riskTrends),
    };

    const report = await this.prisma.regulatoryReport.create({
      data: {
        reportType: RegulatoryReportType.ANNUAL_COMPLIANCE,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'PENDING',
        reportPeriod: period,
        reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'ANNUAL_COMPLIANCE',
          period,
        },
      },
    });

    this.logger.log(`Annual compliance report generated: ${report.id}`);

    return { report, data: reportData };
  }

  private async getRegulatoryBodyStats(startDate: Date, endDate: Date) {
    const reportsByBody = await this.prisma.regulatoryReport.groupBy({
      by: ['regulatoryBody'],
      where: {
        createdAt: { gte: startDate, lt: endDate },
      },
      _count: {
        id: true,
      },
      _sum: {
        // Note: This would need actual numeric fields in the schema
      },
    });

    return reportsByBody.map(stat => ({
      regulatoryBody: stat.regulatoryBody,
      reportCount: stat._count.id,
    }));
  }

  private async getRiskMetrics(startDate: Date, endDate: Date) {
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: { gte: startDate, lt: endDate },
      },
    });

    const suspiciousTransactions = transactions.filter(t => t.isSuspicious);
    const highRiskTransactions = transactions.filter(t => (t.riskScore || 0) > 0.7);

    return {
      totalTransactions: transactions.length,
      suspiciousTransactions: suspiciousTransactions.length,
      highRiskTransactions: highRiskTransactions.length,
      suspiciousRate: transactions.length > 0 ? (suspiciousTransactions.length / transactions.length) * 100 : 0,
      highRiskRate: transactions.length > 0 ? (highRiskTransactions.length / transactions.length) * 100 : 0,
      avgRiskScore: transactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / transactions.length,
    };
  }

  private async getComplianceMetrics(startDate: Date, endDate: Date) {
    const [reports, onTimeReports, lateReports] = await Promise.all([
      this.prisma.regulatoryReport.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
          submissionDate: {
            // This would need business logic to determine "on time"
            lte: new Date(),
          },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
          submissionDate: {
            // This would need business logic to determine "late"
            gt: new Date(),
          },
        },
      }),
    ]);

    return {
      totalReports: reports,
      onTimeReports,
      lateReports,
      onTimeRate: reports > 0 ? (onTimeReports / reports) * 100 : 0,
      lateRate: reports > 0 ? (lateReports / reports) * 100 : 0,
    };
  }

  private async generateComplianceRecommendations(startDate: Date, endDate: Date) {
    const recommendations = [];

    const riskMetrics = await this.getRiskMetrics(startDate, endDate);
    if (riskMetrics.suspiciousRate > 5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'RISK_MANAGEMENT',
        recommendation: 'Review and enhance suspicious activity detection thresholds',
        rationale: `Suspicious transaction rate is ${riskMetrics.suspiciousRate.toFixed(2)}% (target: <5%)`,
      });
    }

    const complianceMetrics = await this.getComplianceMetrics(startDate, endDate);
    if (complianceMetrics.lateRate > 10) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'REPORTING',
        recommendation: 'Implement automated report scheduling and reminders',
        rationale: `Late submission rate is ${complianceMetrics.lateRate.toFixed(2)}% (target: <10%)`,
      });
    }

    return recommendations;
  }

  private async getAnnualComplianceStats(startDate: Date, endDate: Date) {
    const [
      totalReports,
      totalSars,
      totalSubmissions,
      totalRejections,
      uniqueReportTypes,
    ] = await Promise.all([
      this.prisma.regulatoryReport.count({
        where: { createdAt: { gte: startDate, lt: endDate } },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          status: 'SUBMITTED',
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: {
          status: 'REJECTED',
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.regulatoryReport.groupBy({
        by: ['reportType'],
        where: { createdAt: { gte: startDate, lt: endDate } },
      }),
    ]);

    return {
      totalReports,
      totalSars,
      totalSubmissions,
      totalRejections,
      submissionRate: totalReports > 0 ? (totalSubmissions / totalReports) * 100 : 0,
      rejectionRate: totalReports > 0 ? (totalRejections / totalReports) * 100 : 0,
      sarRate: totalReports > 0 ? (totalSars / totalReports) * 100 : 0,
      reportTypeVariety: uniqueReportTypes.length,
    };
  }

  private async getAnnualRiskTrends(startDate: Date, endDate: Date) {
    // Get monthly risk data for trend analysis
    const months = this.getMonthsInPeriod(startDate, endDate);
    const monthlyRiskData = [];

    for (const month of months) {
      const monthStart = new Date(month);
      const monthEnd = new Date(month);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [transactions, suspicious] = await Promise.all([
        this.prisma.regulatoryTransaction.count({
          where: { timestamp: { gte: monthStart, lt: monthEnd } },
        }),
        this.prisma.regulatoryTransaction.count({
          where: {
            timestamp: { gte: monthStart, lt: monthEnd },
            isSuspicious: true,
          },
        }),
      ]);

      monthlyRiskData.push({
        month,
        totalTransactions: transactions,
        suspiciousTransactions: suspicious,
        suspiciousRate: transactions > 0 ? (suspicious / transactions) * 100 : 0,
      });
    }

    return {
      monthlyData: monthlyRiskData,
      trend: this.calculateRiskTrend(monthlyRiskData),
      peakMonth: monthlyRiskData.reduce((max, month) => 
        month.suspiciousRate > max.suspiciousRate ? month : max
      ),
      lowestMonth: monthlyRiskData.reduce((min, month) => 
        month.suspiciousRate < min.suspiciousRate ? month : min
      ),
    };
  }

  private calculateAnnualComplianceScore(annualStats: any): number {
    let score = 100;

    // Deduct points for high rejection rate
    if (annualStats.rejectionRate > 5) {
      score -= (annualStats.rejectionRate - 5) * 2;
    }

    // Deduct points for low submission rate
    if (annualStats.submissionRate < 95) {
      score -= (95 - annualStats.submissionRate) * 1;
    }

    // Deduct points for high SAR rate (could indicate issues)
    if (annualStats.sarRate > 10) {
      score -= (annualStats.sarRate - 10) * 0.5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private async generateAnnualRecommendations(annualStats: any, riskTrends: any) {
    const recommendations = [];

    if (annualStats.rejectionRate > 5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'REPORTING_QUALITY',
        recommendation: 'Implement pre-submission validation and quality checks',
        rationale: `Annual rejection rate is ${annualStats.rejectionRate.toFixed(2)}% (target: <5%)`,
      });
    }

    if (riskTrends.trend === 'INCREASING') {
      recommendations.push({
        priority: 'HIGH',
        category: 'RISK_MANAGEMENT',
        recommendation: 'Review and strengthen risk monitoring protocols',
        rationale: 'Risk metrics show increasing trend throughout the year',
      });
    }

    if (annualStats.submissionRate < 95) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PROCESS_IMPROVEMENT',
        recommendation: 'Streamline reporting processes and implement automation',
        rationale: `Annual submission rate is ${annualStats.submissionRate.toFixed(2)}% (target: >95%)`,
      });
    }

    return recommendations;
  }

  private calculateRiskTrend(monthlyData: any[]): string {
    if (monthlyData.length < 2) return 'INSUFFICIENT_DATA';

    const firstHalf = monthlyData.slice(0, Math.floor(monthlyData.length / 2));
    const secondHalf = monthlyData.slice(Math.floor(monthlyData.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, month) => sum + month.suspiciousRate, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, month) => sum + month.suspiciousRate, 0) / secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.1) return 'INCREASING';
    if (secondHalfAvg < firstHalfAvg * 0.9) return 'DECREASING';
    return 'STABLE';
  }

  private getQuartersInYear(year: string): string[] {
    return [
      `${year}-Q1`,
      `${year}-Q2`,
      `${year}-Q3`,
      `${year}-Q4`,
    ];
  }

  private getMonthsInPeriod(startDate: Date, endDate: Date): string[] {
    const months = [];
    const current = new Date(startDate);
    
    while (current < endDate) {
      months.push(current.toISOString().slice(0, 7)); // YYYY-MM format
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }

  private extractQuarter(period: string): string {
    if (period.includes('-Q')) {
      return period.split('-Q')[1];
    }
    return 'N/A';
  }

  private extractYear(period: string): string {
    return period.slice(0, 4);
  }

  private getPeriodStartDate(period: string): Date {
    if (period.includes('-Q')) {
      const [year, quarter] = period.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      return new Date(parseInt(year), quarterStartMonth, 1);
    } else if (period.length === 7) {
      return new Date(period + '-01');
    } else if (period.length === 4) {
      return new Date(period + '-01-01');
    }
    return new Date(period);
  }

  private getPeriodEndDate(period: string): Date {
    const startDate = this.getPeriodStartDate(period);
    
    if (period.includes('-Q')) {
      return new Date(startDate.getFullYear(), startDate.getMonth() + 3, 1);
    } else if (period.length === 7) {
      return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    } else if (period.length === 4) {
      return new Date(startDate.getFullYear() + 1, 0, 1);
    }
    
    return new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  }
}
