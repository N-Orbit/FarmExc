import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TradeReportingService } from './services/trade-reporting.service';
import { SuspiciousActivityService } from './services/suspicious-activity.service';
import { ComplianceReportingService } from './services/compliance-reporting.service';
import { ExaminerAccessService } from './services/examiner-access.service';
import { ReportGenerationService } from './services/report-generation.service';
import { NotificationService } from './services/notification.service';
import { AuditTrailService } from './services/audit-trail.service';
import {
  CreateReportDto,
  SubmitReportDto,
  GetReportsDto,
  ExaminerAccessDto,
  ComplianceConfigDto,
} from './dto/regulatory-reporting.dto';
import { RegulatoryReportType, RegulatoryReportStatus, RegulatoryBody } from '@prisma/client';

@Injectable()
export class RegulatoryReportingService {
  private readonly logger = new Logger(RegulatoryReportingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradeReportingService: TradeReportingService,
    private readonly suspiciousActivityService: SuspiciousActivityService,
    private readonly complianceReportingService: ComplianceReportingService,
    private readonly examinerAccessService: ExaminerAccessService,
    private readonly reportGenerationService: ReportGenerationService,
    private readonly notificationService: NotificationService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async createReport(createReportDto: CreateReportDto, userId: string) {
    this.logger.log(`Creating ${createReportDto.reportType} report for ${createReportDto.regulatoryBody}`);
    
    const report = await this.prisma.regulatoryReport.create({
      data: {
        reportType: createReportDto.reportType,
        regulatoryBody: createReportDto.regulatoryBody,
        reportPeriod: createReportDto.reportPeriod,
        reportData: createReportDto.reportData || {},
        metadata: createReportDto.metadata || {},
        tenantId: createReportDto.tenantId,
      },
    });

    // Log creation
    await this.auditTrailService.logAction({
      reportId: report.id,
      action: 'CREATED',
      userId,
      details: { reportType: createReportDto.reportType, regulatoryBody: createReportDto.regulatoryBody },
    });

    return report;
  }

  async getReports(query: GetReportsDto) {
    const where: any = {};

    if (query.reportType) where.reportType = query.reportType;
    if (query.regulatoryBody) where.regulatoryBody = query.regulatoryBody;
    if (query.status) where.status = query.status;
    if (query.reportPeriod) where.reportPeriod = query.reportPeriod;
    if (query.tenantId) where.tenantId = query.tenantId;

    const [reports, total] = await Promise.all([
      this.prisma.regulatoryReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
        include: {
          transactions: {
            take: 5,
            orderBy: { timestamp: 'desc' },
          },
          _count: {
            select: {
              transactions: true,
              auditTrail: true,
            },
          },
        },
      }),
      this.prisma.regulatoryReport.count({ where }),
    ]);

    return { reports, total, limit: query.limit || 50, offset: query.offset || 0 };
  }

  async getReport(id: string) {
    const report = await this.prisma.regulatoryReport.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
        },
        auditTrail: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    return report;
  }

  async submitReport(id: string, submitDto: SubmitReportDto, userId: string) {
    const report = await this.prisma.regulatoryReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    if (report.status !== RegulatoryReportStatus.PENDING) {
      throw new BadRequestException(`Report ${id} is not in submittable status`);
    }

    // Generate report file if not exists
    if (!report.filePath) {
      await this.reportGenerationService.generateReportFile(report);
    }

    // Submit to regulatory body (mock implementation)
    const submissionId = await this.submitToRegulatoryBody(report, submitDto);

    // Update report status
    const updatedReport = await this.prisma.regulatoryReport.update({
      where: { id },
      data: {
        status: RegulatoryReportStatus.SUBMITTED,
        submissionId,
        submissionDate: new Date(),
      },
    });

    // Log submission
    await this.auditTrailService.logAction({
      reportId: id,
      action: 'SUBMITTED',
      userId,
      details: { submissionId, regulatoryBody: report.regulatoryBody },
    });

    // Send notifications
    await this.notificationService.sendReportSubmissionNotification(updatedReport);

    return updatedReport;
  }

  async generateReportFile(id: string) {
    const report = await this.prisma.regulatoryReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    return this.reportGenerationService.generateReportFile(report);
  }

  async downloadReport(id: string) {
    const report = await this.prisma.regulatoryReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    if (!report.filePath) {
      throw new BadRequestException(`Report file not generated for ${id}`);
    }

    return this.reportGenerationService.downloadReportFile(report);
  }

  async generateTradeReport(reportPeriod: string, format?: string) {
    this.logger.log(`Generating trade report for period: ${reportPeriod}`);
    
    return this.tradeReportingService.generateTradeReport(reportPeriod, format);
  }

  async generateSar(suspiciousActivityIds: string[], reason: string) {
    this.logger.log(`Generating SAR for ${suspiciousActivityIds.length} activities`);
    
    return this.suspiciousActivityService.generateSar(suspiciousActivityIds, reason);
  }

  async generateComplianceReport(reportType: string, period: string) {
    this.logger.log(`Generating ${reportType} compliance report for period: ${period}`);
    
    return this.complianceReportingService.generateComplianceReport(reportType, period);
  }

  async getSuspiciousActivities(query: any) {
    return this.suspiciousActivityService.getSuspiciousActivities(query);
  }

  async grantExaminerAccess(accessDto: ExaminerAccessDto) {
    return this.examinerAccessService.grantAccess(accessDto);
  }

  async getExaminerAccess(examinerId: string) {
    return this.examinerAccessService.getAccess(examinerId);
  }

  async revokeExaminerAccess(examinerId: string) {
    return this.examinerAccessService.revokeAccess(examinerId);
  }

  async getComplianceConfig(regulatoryBody?: string) {
    const where = regulatoryBody ? { regulatoryBody } : {};
    
    return this.prisma.complianceConfiguration.findMany({
      where,
      orderBy: { regulatoryBody: 'asc' },
    });
  }

  async updateComplianceConfig(configDto: ComplianceConfigDto) {
    return this.prisma.complianceConfiguration.upsert({
      where: {
        regulatoryBody_reportType_tenantId: {
          regulatoryBody: configDto.regulatoryBody,
          reportType: configDto.reportType,
          tenantId: configDto.tenantId || null,
        },
      },
      update: configDto,
      create: configDto,
    });
  }

  async getAuditTrail(query: { reportId?: string; limit?: number; offset?: number }) {
    return this.auditTrailService.getAuditTrail(query);
  }

  async getDashboard(period?: string) {
    const defaultPeriod = period || new Date().toISOString().slice(0, 7); // Current month
    
    const [
      totalReports,
      pendingReports,
      submittedReports,
      rejectedReports,
      recentSars,
      largeTradeReports,
    ] = await Promise.all([
      this.prisma.regulatoryReport.count({
        where: { reportPeriod: { startsWith: defaultPeriod } },
      }),
      this.prisma.regulatoryReport.count({
        where: { 
          status: RegulatoryReportStatus.PENDING,
          reportPeriod: { startsWith: defaultPeriod },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: { 
          status: RegulatoryReportStatus.SUBMITTED,
          reportPeriod: { startsWith: defaultPeriod },
        },
      }),
      this.prisma.regulatoryReport.count({
        where: { 
          status: RegulatoryReportStatus.REJECTED,
          reportPeriod: { startsWith: defaultPeriod },
        },
      }),
      this.prisma.regulatoryReport.findMany({
        where: { 
          reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
          reportPeriod: { startsWith: defaultPeriod },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.regulatoryReport.findMany({
        where: { 
          reportType: RegulatoryReportType.LARGE_TRADE_REPORT,
          reportPeriod: { startsWith: defaultPeriod },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      period: defaultPeriod,
      summary: {
        totalReports,
        pendingReports,
        submittedReports,
        rejectedReports,
      },
      recentSars,
      largeTradeReports,
    };
  }

  private async submitToRegulatoryBody(report: any, submitDto: SubmitReportDto): Promise<string> {
    // Mock implementation - in production, this would integrate with actual regulatory APIs
    const submissionId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`Submitting report ${report.id} to ${report.regulatoryBody} with submission ID: ${submissionId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return submissionId;
  }
}
