import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryReportingService } from './regulatory-reporting.service';
import { PrismaService } from '../prisma/prisma.service';
import { TradeReportingService } from './services/trade-reporting.service';
import { SuspiciousActivityService } from './services/suspicious-activity.service';
import { ComplianceReportingService } from './services/compliance-reporting.service';
import { ExaminerAccessService } from './services/examiner-access.service';
import { ReportGenerationService } from './services/report-generation.service';
import { NotificationService } from './services/notification.service';
import { AuditTrailService } from './services/audit-trail.service';
import { RegulatoryReportType, RegulatoryBody, RegulatoryReportStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RegulatoryReportingService', () => {
  let service: RegulatoryReportingService;
  let prisma: PrismaService;
  let tradeReportingService: TradeReportingService;
  let suspiciousActivityService: SuspiciousActivityService;
  let complianceReportingService: ComplianceReportingService;
  let examinerAccessService: ExaminerAccessService;
  let reportGenerationService: ReportGenerationService;
  let notificationService: NotificationService;
  let auditTrailService: AuditTrailService;

  const mockPrisma = {
    regulatoryReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    regulatoryTransaction: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    regulatoryAuditTrail: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    complianceConfiguration: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockTradeReportingService = {
    generateTradeReport: jest.fn(),
  };

  const mockSuspiciousActivityService = {
    generateSar: jest.fn(),
    getSuspiciousActivities: jest.fn(),
  };

  const mockComplianceReportingService = {
    generateComplianceReport: jest.fn(),
  };

  const mockExaminerAccessService = {
    grantAccess: jest.fn(),
    getAccess: jest.fn(),
    revokeAccess: jest.fn(),
  };

  const mockReportGenerationService = {
    generateReportFile: jest.fn(),
    downloadReportFile: jest.fn(),
  };

  const mockNotificationService = {
    sendReportSubmissionNotification: jest.fn(),
  };

  const mockAuditTrailService = {
    logAction: jest.fn(),
    getAuditTrail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryReportingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: TradeReportingService,
          useValue: mockTradeReportingService,
        },
        {
          provide: SuspiciousActivityService,
          useValue: mockSuspiciousActivityService,
        },
        {
          provide: ComplianceReportingService,
          useValue: mockComplianceReportingService,
        },
        {
          provide: ExaminerAccessService,
          useValue: mockExaminerAccessService,
        },
        {
          provide: ReportGenerationService,
          useValue: mockReportGenerationService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: AuditTrailService,
          useValue: mockAuditTrailService,
        },
      ],
    }).compile();

    service = module.get<RegulatoryReportingService>(RegulatoryReportingService);
    prisma = module.get<PrismaService>(PrismaService);
    tradeReportingService = module.get<TradeReportingService>(TradeReportingService);
    suspiciousActivityService = module.get<SuspiciousActivityService>(SuspiciousActivityService);
    complianceReportingService = module.get<ComplianceReportingService>(ComplianceReportingService);
    examinerAccessService = module.get<ExaminerAccessService>(ExaminerAccessService);
    reportGenerationService = module.get<ReportGenerationService>(ReportGenerationService);
    notificationService = module.get<NotificationService>(NotificationService);
    auditTrailService = module.get<AuditTrailService>(AuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    it('should create a new regulatory report', async () => {
      const createReportDto = {
        reportType: RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        reportPeriod: '2024-01',
        reportData: { test: 'data' },
        metadata: { source: 'api' },
      };
      const userId = 'user_123';

      const expectedReport = {
        id: 'report_123',
        ...createReportDto,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.regulatoryReport.create.mockResolvedValue(expectedReport);
      mockAuditTrailService.logAction.mockResolvedValue({});

      const result = await service.createReport(createReportDto, userId);

      expect(prisma.regulatoryReport.create).toHaveBeenCalledWith({
        data: {
          reportType: createReportDto.reportType,
          regulatoryBody: createReportDto.regulatoryBody,
          reportPeriod: createReportDto.reportPeriod,
          reportData: createReportDto.reportData,
          metadata: createReportDto.metadata,
          tenantId: createReportDto.tenantId,
        },
      });
      expect(auditTrailService.logAction).toHaveBeenCalledWith({
        reportId: expectedReport.id,
        action: 'CREATED',
        userId,
        details: {
          reportType: createReportDto.reportType,
          regulatoryBody: createReportDto.regulatoryBody,
        },
      });
      expect(result).toEqual(expectedReport);
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      const query = {
        reportType: RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        limit: 10,
        offset: 0,
      };

      const expectedReports = [
        {
          id: 'report_1',
          reportType: RegulatoryReportType.TRADE_REPORT,
          regulatoryBody: RegulatoryBody.FINRA,
          status: 'SUBMITTED',
        },
      ];

      const expectedTotal = 1;

      mockPrisma.regulatoryReport.findMany.mockResolvedValue(expectedReports);
      mockPrisma.regulatoryReport.count.mockResolvedValue(expectedTotal);

      const result = await service.getReports(query);

      expect(prisma.regulatoryReport.findMany).toHaveBeenCalledWith({
        where: {
          reportType: query.reportType,
          regulatoryBody: query.regulatoryBody,
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
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
      });
      expect(result).toEqual({
        reports: expectedReports,
        total: expectedTotal,
        limit: query.limit,
        offset: query.offset,
      });
    });
  });

  describe('getReport', () => {
    it('should return a specific report with relations', async () => {
      const reportId = 'report_123';
      const expectedReport = {
        id: reportId,
        reportType: RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'SUBMITTED',
        transactions: [],
        auditTrail: [],
      };

      mockPrisma.regulatoryReport.findUnique.mockResolvedValue(expectedReport);

      const result = await service.getReport(reportId);

      expect(prisma.regulatoryReport.findUnique).toHaveBeenCalledWith({
        where: { id: reportId },
        include: {
          transactions: {
            orderBy: { timestamp: 'desc' },
          },
          auditTrail: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(result).toEqual(expectedReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      const reportId = 'nonexistent_report';

      mockPrisma.regulatoryReport.findUnique.mockResolvedValue(null);

      await expect(service.getReport(reportId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitReport', () => {
    it('should submit a report to regulatory body', async () => {
      const reportId = 'report_123';
      const submitDto = {
        submissionFormat: 'XML',
        priority: 'HIGH',
      };
      const userId = 'user_123';

      const report = {
        id: reportId,
        reportType: RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'PENDING',
        filePath: null,
      };

      const updatedReport = {
        ...report,
        status: 'SUBMITTED',
        submissionId: 'SUB_123456',
        submissionDate: new Date(),
      };

      mockPrisma.regulatoryReport.findUnique.mockResolvedValue(report);
      mockReportGenerationService.generateReportFile.mockResolvedValue({ filePath: '/path/to/file' });
      mockPrisma.regulatoryReport.update.mockResolvedValue(updatedReport);
      mockAuditTrailService.logAction.mockResolvedValue({});
      mockNotificationService.sendReportSubmissionNotification.mockResolvedValue({});

      const result = await service.submitReport(reportId, submitDto, userId);

      expect(prisma.regulatoryReport.update).toHaveBeenCalledWith({
        where: { id: reportId },
        data: {
          status: 'SUBMITTED',
          submissionId: 'SUB_123456',
          submissionDate: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      const reportId = 'nonexistent_report';
      const submitDto = { submissionFormat: 'XML' };
      const userId = 'user_123';

      mockPrisma.regulatoryReport.findUnique.mockResolvedValue(null);

      await expect(service.submitReport(reportId, submitDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if report not in PENDING status', async () => {
      const reportId = 'report_123';
      const submitDto = { submissionFormat: 'XML' };
      const userId = 'user_123';

      const report = {
        id: reportId,
        status: 'SUBMITTED',
      };

      mockPrisma.regulatoryReport.findUnique.mockResolvedValue(report);

      await expect(service.submitReport(reportId, submitDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTradeReport', () => {
    it('should generate a trade report', async () => {
      const reportPeriod = '2024-01';
      const format = 'FINRA_XML';

      const expectedResult = {
        report: {
          id: 'trade_report_123',
          reportType: RegulatoryReportType.TRADE_REPORT,
        },
        summary: {
          period: reportPeriod,
          totalTransactions: 150,
          largeTrades: 5,
          format,
        },
      };

      mockTradeReportingService.generateTradeReport.mockResolvedValue(expectedResult);

      const result = await service.generateTradeReport(reportPeriod, format);

      expect(tradeReportingService.generateTradeReport).toHaveBeenCalledWith(reportPeriod, format);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('generateSar', () => {
    it('should generate a suspicious activity report', async () => {
      const suspiciousActivityIds = ['activity_1', 'activity_2'];
      const reason = 'Unusual trading pattern';

      const expectedResult = {
        report: {
          id: 'sar_123',
          reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
        },
        activities: 2,
        summary: {
          reportId: 'sar_123',
          suspiciousActivities: 2,
          reason,
          riskLevel: 'HIGH',
        },
      };

      mockSuspiciousActivityService.generateSar.mockResolvedValue(expectedResult);

      const result = await service.generateSar(suspiciousActivityIds, reason);

      expect(suspiciousActivityService.generateSar).toHaveBeenCalledWith(suspiciousActivityIds, reason);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const reportType = 'QUARTERLY';
      const period = '2024-Q1';

      const expectedResult = {
        report: {
          id: 'compliance_123',
          reportType: RegulatoryReportType.QUARTERLY_COMPLIANCE,
        },
        data: {
          period,
          quarter: 'Q1',
          year: '2024',
        },
      };

      mockComplianceReportingService.generateComplianceReport.mockResolvedValue(expectedResult);

      const result = await service.generateComplianceReport(reportType, period);

      expect(complianceReportingService.generateComplianceReport).toHaveBeenCalledWith(reportType, period);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data for a period', async () => {
      const period = '2024-01';

      const mockCounts = [
        { count: 25 }, // totalReports
        { count: 3 },  // pendingReports
        { count: 20 }, // submittedReports
        { count: 2 },  // rejectedReports
      ];

      const mockReports = [
        { id: 'sar_1', reportType: 'SUSPICIOUS_ACTIVITY_REPORT' },
      ];

      mockPrisma.regulatoryReport.count
        .mockResolvedValueOnce(mockCounts[0].count)
        .mockResolvedValueOnce(mockCounts[1].count)
        .mockResolvedValueOnce(mockCounts[2].count)
        .mockResolvedValueOnce(mockCounts[3].count);

      mockPrisma.regulatoryReport.findMany
        .mockResolvedValueOnce(mockReports)
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(period);

      expect(result).toEqual({
        period,
        summary: {
          totalReports: 25,
          pendingReports: 3,
          submittedReports: 20,
          rejectedReports: 2,
        },
        recentSars: mockReports,
        largeTradeReports: [],
      });
    });
  });

  describe('getComplianceConfig', () => {
    it('should return compliance configurations', async () => {
      const regulatoryBody = RegulatoryBody.FINRA;

      const expectedConfigs = [
        {
          id: 'config_1',
          regulatoryBody,
          reportType: RegulatoryReportType.TRADE_REPORT,
          isActive: true,
        },
      ];

      mockPrisma.complianceConfiguration.findMany.mockResolvedValue(expectedConfigs);

      const result = await service.getComplianceConfig(regulatoryBody);

      expect(prisma.complianceConfiguration.findMany).toHaveBeenCalledWith({
        where: regulatoryBody ? { regulatoryBody } : {},
        orderBy: { regulatoryBody: 'asc' },
      });
      expect(result).toEqual(expectedConfigs);
    });
  });

  describe('updateComplianceConfig', () => {
    it('should update or create compliance configuration', async () => {
      const configDto = {
        regulatoryBody: RegulatoryBody.FINRA,
        reportType: RegulatoryReportType.TRADE_REPORT,
        reportingFrequency: 'MONTHLY',
        submissionFormat: 'XML',
        notificationEmails: ['compliance@company.com'],
      };

      const expectedConfig = {
        id: 'config_1',
        ...configDto,
        isActive: true,
        encryptionRequired: true,
        retentionPeriodYears: 7,
      };

      mockPrisma.complianceConfiguration.upsert.mockResolvedValue(expectedConfig);

      const result = await service.updateComplianceConfig(configDto);

      expect(prisma.complianceConfiguration.upsert).toHaveBeenCalledWith({
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
      expect(result).toEqual(expectedConfig);
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail', async () => {
      const query = {
        reportId: 'report_123',
        limit: 50,
        offset: 0,
      };

      const expectedAuditTrail = [
        {
          id: 'audit_1',
          reportId: 'report_123',
          action: 'CREATED',
          createdAt: new Date(),
        },
      ];

      const expectedTotal = 1;

      mockAuditTrailService.getAuditTrail.mockResolvedValue({
        auditTrail: expectedAuditTrail,
        total: expectedTotal,
      });

      const result = await service.getAuditTrail(query);

      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        auditTrail: expectedAuditTrail,
        total: expectedTotal,
      });
    });
  });
});
