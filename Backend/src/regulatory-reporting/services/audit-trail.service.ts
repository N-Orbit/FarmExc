import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(data: {
    reportId: string;
    action: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    this.logger.log(`Logging audit action: ${data.action} for report ${data.reportId}`);

    try {
      const auditEntry = await this.prisma.regulatoryAuditTrail.create({
        data: {
          reportId: data.reportId,
          action: data.action,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details || {},
        },
      });

      this.logger.log(`Audit entry created: ${auditEntry.id}`);

      return auditEntry;
    } catch (error) {
      this.logger.error(`Failed to log audit action:`, error);
      throw error;
    }
  }

  async getAuditTrail(query: { reportId?: string; limit?: number; offset?: number }) {
    const where: any = {};
    
    if (query.reportId) {
      where.reportId = query.reportId;
    }

    const [auditTrail, total] = await Promise.all([
      this.prisma.regulatoryAuditTrail.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
        include: {
          report: {
            select: {
              id: true,
              reportType: true,
              regulatoryBody: true,
              reportPeriod: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.regulatoryAuditTrail.count({ where }),
    ]);

    return {
      auditTrail,
      total,
      limit: query.limit || 100,
      offset: query.offset || 0,
    };
  }

  async getReportAuditTrail(reportId: string) {
    const auditTrail = await this.prisma.regulatoryAuditTrail.findMany({
      where: { reportId },
      orderBy: { createdAt: 'asc' },
      include: {
        report: {
          select: {
            id: true,
            reportType: true,
            regulatoryBody: true,
            reportPeriod: true,
            status: true,
            submissionId: true,
            submissionDate: true,
          },
        },
      },
    });

    // Group actions by type for better visualization
    const groupedActions = auditTrail.reduce((groups, entry) => {
      const action = entry.action;
      if (!groups[action]) {
        groups[action] = [];
      }
      groups[action].push(entry);
      return groups;
    }, {} as Record<string, any[]>);

    return {
      reportId,
      auditTrail,
      groupedActions,
      summary: {
        totalActions: auditTrail.length,
        uniqueActions: Object.keys(groupedActions).length,
        firstAction: auditTrail[0]?.createdAt || null,
        lastAction: auditTrail[auditTrail.length - 1]?.createdAt || null,
        actionsByType: Object.fromEntries(
          Object.entries(groupedActions).map(([action, entries]) => [action, entries.length])
        ),
      },
    };
  }

  async getUserAuditTrail(userId: string, limit: number = 50) {
    const auditTrail = await this.prisma.regulatoryAuditTrail.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        report: {
          select: {
            id: true,
            reportType: true,
            regulatoryBody: true,
            reportPeriod: true,
            status: true,
          },
        },
      },
    });

    return {
      userId,
      auditTrail,
      summary: {
        totalActions: auditTrail.length,
        recentActions: auditTrail.slice(0, 10),
        actionFrequency: this.calculateActionFrequency(auditTrail),
      },
    };
  }

  async getAuditSummary(filters: {
    startDate?: Date;
    endDate?: Date;
    reportType?: string;
    regulatoryBody?: string;
    action?: string;
  }) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    // If reportType or regulatoryBody is specified, we need to join with reports
    const includeReports = !!(filters.reportType || filters.regulatoryBody);
    
    const auditTrail = await this.prisma.regulatoryAuditTrail.findMany({
      where,
      include: {
        report: includeReports ? {
          select: {
            reportType: true,
            regulatoryBody: true,
          },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by reportType/regulatoryBody if needed
    const filteredTrail = auditTrail.filter(entry => {
      if (filters.reportType && entry.report?.reportType !== filters.reportType) {
        return false;
      }
      if (filters.regulatoryBody && entry.report?.regulatoryBody !== filters.regulatoryBody) {
        return false;
      }
      return true;
    });

    return {
      summary: {
        totalActions: filteredTrail.length,
        uniqueUsers: new Set(filteredTrail.map(e => e.userId).filter(Boolean)).size,
        uniqueReports: new Set(filteredTrail.map(e => e.reportId)).size,
        actionBreakdown: this.calculateActionBreakdown(filteredTrail),
        timeDistribution: this.calculateTimeDistribution(filteredTrail),
        topUsers: this.getTopUsers(filteredTrail),
      },
      period: {
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      },
      filters,
    };
  }

  async createComplianceAuditReport(period: string) {
    this.logger.log(`Creating compliance audit report for period: ${period}`);

    const startDate = this.getPeriodStartDate(period);
    const endDate = this.getPeriodEndDate(period);

    const auditTrail = await this.prisma.regulatoryAuditTrail.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        report: {
          select: {
            reportType: true,
            regulatoryBody: true,
            status: true,
            submissionDate: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const auditReport = {
      period,
      auditTrail: auditTrail.length,
      summary: {
        totalActions: auditTrail.length,
        uniqueUsers: new Set(auditTrail.map(e => e.userId).filter(Boolean)).size,
        uniqueReports: new Set(auditTrail.map(e => e.reportId)).size,
        criticalActions: auditTrail.filter(e => 
          ['SUBMITTED', 'REJECTED', 'CREATED'].includes(e.action)
        ).length,
      },
      actionAnalysis: {
        frequency: this.calculateActionFrequency(auditTrail),
        byRegulatoryBody: this.groupByRegulatoryBody(auditTrail),
        byReportType: this.groupByReportType(auditTrail),
        timeAnalysis: this.calculateTimeDistribution(auditTrail),
      },
      complianceMetrics: {
        submissionActions: auditTrail.filter(e => e.action === 'SUBMITTED').length,
        rejectionActions: auditTrail.filter(e => e.action === 'REJECTED').length,
        creationActions: auditTrail.filter(e => e.action === 'CREATED').length,
        viewActions: auditTrail.filter(e => e.action === 'VIEWED').length,
        downloadActions: auditTrail.filter(e => e.action === 'DOWNLOADED').length,
      },
      securityMetrics: {
        uniqueIPAddresses: new Set(auditTrail.map(e => e.ipAddress).filter(Boolean)).size,
        suspiciousPatterns: this.detectSuspiciousPatterns(auditTrail),
        afterHoursActivity: this.detectAfterHoursActivity(auditTrail),
      },
      recommendations: this.generateAuditRecommendations(auditTrail),
    };

    return auditReport;
  }

  async exportAuditTrail(filters: any, format: 'csv' | 'json' | 'xml' = 'csv') {
    const auditTrail = await this.prisma.regulatoryAuditTrail.findMany({
      where: this.buildAuditFilters(filters),
      include: {
        report: {
          select: {
            reportType: true,
            regulatoryBody: true,
            reportPeriod: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    switch (format) {
      case 'csv':
        return this.exportToCsv(auditTrail);
      case 'json':
        return this.exportToJson(auditTrail);
      case 'xml':
        return this.exportToXml(auditTrail);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private calculateActionFrequency(auditTrail: any[]) {
    const frequency = auditTrail.reduce((freq, entry) => {
      freq[entry.action] = (freq[entry.action] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([action, count]) => ({ action, count }));
  }

  private calculateActionBreakdown(auditTrail: any[]) {
    const breakdown = {
      created: 0,
      submitted: 0,
      rejected: 0,
      viewed: 0,
      downloaded: 0,
      other: 0,
    };

    auditTrail.forEach(entry => {
      const action = entry.action.toLowerCase();
      if (action.includes('create')) breakdown.created++;
      else if (action.includes('submit')) breakdown.submitted++;
      else if (action.includes('reject')) breakdown.rejected++;
      else if (action.includes('view')) breakdown.viewed++;
      else if (action.includes('download')) breakdown.downloaded++;
      else breakdown.other++;
    });

    return breakdown;
  }

  private calculateTimeDistribution(auditTrail: any[]) {
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);

    auditTrail.forEach(entry => {
      const hour = entry.createdAt.getHours();
      const day = entry.createdAt.getDay();
      
      hourlyDistribution[hour]++;
      dailyDistribution[day]++;
    });

    return {
      hourly: hourlyDistribution.map((count, hour) => ({ hour, count })),
      daily: dailyDistribution.map((count, day) => ({ 
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day], 
        count 
      })),
      peakHour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution)),
      peakDay: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dailyDistribution.indexOf(Math.max(...dailyDistribution))],
    };
  }

  private getTopUsers(auditTrail: any[], limit: number = 10) {
    const userCounts = auditTrail.reduce((counts, entry) => {
      if (entry.userId) {
        counts[entry.userId] = (counts[entry.userId] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }));
  }

  private groupByRegulatoryBody(auditTrail: any[]) {
    const grouped = auditTrail.reduce((groups, entry) => {
      const body = entry.report?.regulatoryBody || 'UNKNOWN';
      groups[body] = (groups[body] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .map(([regulatoryBody, count]) => ({ regulatoryBody, count }));
  }

  private groupByReportType(auditTrail: any[]) {
    const grouped = auditTrail.reduce((groups, entry) => {
      const type = entry.report?.reportType || 'UNKNOWN';
      groups[type] = (groups[type] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .map(([reportType, count]) => ({ reportType, count }));
  }

  private detectSuspiciousPatterns(auditTrail: any[]) {
    const patterns = [];

    // Check for rapid successive actions from same user
    const userActions = auditTrail.reduce((actions, entry) => {
      if (entry.userId) {
        if (!actions[entry.userId]) actions[entry.userId] = [];
        actions[entry.userId].push(entry);
      }
      return actions;
    }, {} as Record<string, any[]>);

    Object.entries(userActions).forEach(([userId, actions]) => {
      actions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      for (let i = 1; i < actions.length; i++) {
        const timeDiff = actions[i].createdAt.getTime() - actions[i-1].createdAt.getTime();
        if (timeDiff < 1000) { // Less than 1 second between actions
          patterns.push({
            type: 'RAPID_SUCCESSIVE_ACTIONS',
            userId,
            count: 2,
            timeframe: `${timeDiff}ms`,
          });
        }
      }
    });

    return patterns;
  }

  private detectAfterHoursActivity(auditTrail: any[]) {
    const afterHoursActions = auditTrail.filter(entry => {
      const hour = entry.createdAt.getHours();
      return hour < 6 || hour > 22; // Before 6 AM or after 10 PM
    });

    return {
      count: afterHoursActions.length,
      percentage: auditTrail.length > 0 ? (afterHoursActions.length / auditTrail.length) * 100 : 0,
      details: afterHoursActions.slice(0, 10),
    };
  }

  private generateAuditRecommendations(auditTrail: any[]) {
    const recommendations = [];

    const suspiciousPatterns = this.detectSuspiciousPatterns(auditTrail);
    if (suspiciousPatterns.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'SECURITY',
        recommendation: 'Review rapid successive actions and implement rate limiting',
        rationale: `Detected ${suspiciousPatterns.length} instances of suspicious activity patterns`,
      });
    }

    const afterHours = this.detectAfterHoursActivity(auditTrail);
    if (afterHours.percentage > 20) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'SECURITY',
        recommendation: 'Review after-hours access patterns and consider implementing time-based restrictions',
        rationale: `${afterHours.percentage.toFixed(2)}% of activity occurs during after-hours`,
      });
    }

    return recommendations;
  }

  private buildAuditFilters(filters: any) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.reportId) where.reportId = filters.reportId;

    return where;
  }

  private exportToCsv(auditTrail: any[]): string {
    const headers = ['ID', 'Report ID', 'Action', 'User ID', 'IP Address', 'Created At', 'Details'];
    const rows = auditTrail.map(entry => [
      entry.id,
      entry.reportId,
      entry.action,
      entry.userId || '',
      entry.ipAddress || '',
      entry.createdAt.toISOString(),
      JSON.stringify(entry.details || {}),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private exportToJson(auditTrail: any[]): string {
    return JSON.stringify(auditTrail, null, 2);
  }

  private exportToXml(auditTrail: any[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<AuditTrail>\n';
    const xmlFooter = '</AuditTrail>';

    const xmlEntries = auditTrail.map(entry => `  <Entry>
    <ID>${entry.id}</ID>
    <ReportID>${entry.reportId}</ReportID>
    <Action>${entry.action}</Action>
    <UserID>${entry.userId || ''}</UserID>
    <IPAddress>${entry.ipAddress || ''}</IPAddress>
    <CreatedAt>${entry.createdAt.toISOString()}</CreatedAt>
    <Details>${JSON.stringify(entry.details || {})}</Details>
  </Entry>`).join('\n');

    return xmlHeader + xmlEntries + xmlFooter;
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
