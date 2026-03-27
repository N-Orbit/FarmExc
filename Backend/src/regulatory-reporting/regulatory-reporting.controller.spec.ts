import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryReportingController } from './regulatory-reporting.controller';
import { RegulatoryReportingService } from './regulatory-reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegulatoryReportType, RegulatoryBody } from '@prisma/client';

describe('RegulatoryReportingController', () => {
  let controller: RegulatoryReportingController;
  let service: RegulatoryReportingService;

  const mockRegulatoryReportingService = {
    createReport: jest.fn(),
    getReports: jest.fn(),
    getReport: jest.fn(),
    submitReport: jest.fn(),
    generateReportFile: jest.fn(),
    downloadReport: jest.fn(),
    generateTradeReport: jest.fn(),
    generateSar: jest.fn(),
    generateComplianceReport: jest.fn(),
    getSuspiciousActivities: jest.fn(),
    grantExaminerAccess: jest.fn(),
    getExaminerAccess: jest.fn(),
    revokeExaminerAccess: jest.fn(),
    getComplianceConfig: jest.fn(),
    updateComplianceConfig: jest.fn(),
    getAuditTrail: jest.fn(),
    getDashboard: jest.fn(),
  };

  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    roles: ['ADMIN'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegulatoryReportingController],
      providers: [
        {
          provide: RegulatoryReportingService,
          useValue: mockRegulatoryReportingService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<RegulatoryReportingController>(RegulatoryReportingController);
    service = module.get<RegulatoryReportingService>(RegulatoryReportingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    it('should create a new regulatory report', async () => {
      const createReportDto = {
        reportType: RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        reportPeriod: '2024-01',
        reportData: { test: 'data' },
      };

      const expectedResult = {
        id: 'report_123',
        ...createReportDto,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRegulatoryReportingService.createReport.mockResolvedValue(expectedResult);

      const result = await controller.createReport(createReportDto, { user: mockUser });

      expect(service.createReport).toHaveBeenCalledWith(createReportDto, mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      const query = {
        reportType: RegulatoryReportType.TRADE_REPORT,
        limit: 10,
        offset: 0,
      };

      const expectedResult = {
        reports: [
          {
            id: 'report_1',
            reportType: RegulatoryReportType.TRADE_REPORT,
            status: 'SUBMITTED',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };

      mockRegulatoryReportingService.getReports.mockResolvedValue(expectedResult);

      const result = await controller.getReports(query);

      expect(service.getReports).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getReport', () => {
    it('should return a specific report', async () => {
      const reportId = 'report_123';
      const expectedResult = {
        id: reportId,
        reportType: RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'SUBMITTED',
        transactions: [],
        auditTrail: [],
      };

      mockRegulatoryReportingService.getReport.mockResolvedValue(expectedResult);

      const result = await controller.getReport(reportId);

      expect(service.getReport).toHaveBeenCalledWith(reportId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('submitReport', () => {
    it('should submit a report to regulatory body', async () => {
      const reportId = 'report_123';
      const submitDto = {
        submissionFormat: 'XML',
        priority: 'HIGH',
      };

      const expectedResult = {
        id: reportId,
        status: 'SUBMITTED',
        submissionId: 'SUB_123456',
        submissionDate: new Date(),
      };

      mockRegulatoryReportingService.submitReport.mockResolvedValue(expectedResult);

      const result = await controller.submitReport(reportId, submitDto, { user: mockUser });

      expect(service.submitReport).toHaveBeenCalledWith(reportId, submitDto, mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('generateTradeReport', () => {
    it('should generate a trade report', async () => {
      const body = {
        reportPeriod: '2024-01',
        format: 'FINRA_XML',
      };

      const expectedResult = {
        report: {
          id: 'trade_report_123',
          reportType: RegulatoryReportType.TRADE_REPORT,
          reportPeriod: '2024-01',
        },
        summary: {
          period: '2024-01',
          totalTransactions: 150,
          largeTrades: 5,
          format: 'FINRA_XML',
        },
      };

      mockRegulatoryReportingService.generateTradeReport.mockResolvedValue(expectedResult);

      const result = await controller.generateTradeReport(body);

      expect(service.generateTradeReport).toHaveBeenCalledWith(body.reportPeriod, body.format);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('generateSar', () => {
    it('should generate a suspicious activity report', async () => {
      const body = {
        suspiciousActivityIds: ['activity_1', 'activity_2'],
        reason: 'Unusual trading pattern detected',
      };

      const expectedResult = {
        report: {
          id: 'sar_123',
          reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
        },
        activities: 2,
        summary: {
          reportId: 'sar_123',
          suspiciousActivities: 2,
          reason: 'Unusual trading pattern detected',
          riskLevel: 'HIGH',
        },
      };

      mockRegulatoryReportingService.generateSar.mockResolvedValue(expectedResult);

      const result = await controller.generateSar(body);

      expect(service.generateSar).toHaveBeenCalledWith(body.suspiciousActivityIds, body.reason);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const body = {
        reportType: 'QUARTERLY',
        period: '2024-Q1',
      };

      const expectedResult = {
        report: {
          id: 'compliance_123',
          reportType: RegulatoryReportType.QUARTERLY_COMPLIANCE,
        },
        data: {
          period: '2024-Q1',
          quarter: 'Q1',
          year: '2024',
          summary: {
            totalReports: 25,
            tradeReports: 15,
            sarReports: 3,
            submissionRate: 96.0,
          },
        },
      };

      mockRegulatoryReportingService.generateComplianceReport.mockResolvedValue(expectedResult);

      const result = await controller.generateComplianceReport(body);

      expect(service.generateComplianceReport).toHaveBeenCalledWith(body.reportType, body.period);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSuspiciousActivities', () => {
    it('should return suspicious activities', async () => {
      const query = {
        riskScoreMin: '0.7',
        limit: 20,
        offset: 0,
      };

      const expectedResult = {
        activities: [
          {
            id: 'activity_1',
            transactionHash: '0x123...',
            riskScore: 0.85,
            isSuspicious: true,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      mockRegulatoryReportingService.getSuspiciousActivities.mockResolvedValue(expectedResult);

      const result = await controller.getSuspiciousActivities(query);

      expect(service.getSuspiciousActivities).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('grantExaminerAccess', () => {
    it('should grant examiner access', async () => {
      const accessDto = {
        examinerId: 'examiner_123',
        regulatoryBody: RegulatoryBody.FINRA,
        accessLevel: 'READ_ONLY',
        permissions: ['VIEW_REPORTS', 'DOWNLOAD_REPORTS'],
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
      };

      const expectedResult = {
        id: 'access_123',
        ...accessDto,
        isActive: true,
        createdAt: new Date(),
      };

      mockRegulatoryReportingService.grantExaminerAccess.mockResolvedValue(expectedResult);

      const result = await controller.grantExaminerAccess(accessDto);

      expect(service.grantExaminerAccess).toHaveBeenCalledWith(accessDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getExaminerAccess', () => {
    it('should return examiner access details', async () => {
      const examinerId = 'examiner_123';
      const expectedResult = {
        id: 'access_123',
        examinerId,
        regulatoryBody: RegulatoryBody.FINRA,
        accessLevel: 'READ_ONLY',
        permissions: ['VIEW_REPORTS', 'DOWNLOAD_REPORTS'],
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(),
      };

      mockRegulatoryReportingService.getExaminerAccess.mockResolvedValue(expectedResult);

      const result = await controller.getExaminerAccess(examinerId);

      expect(service.getExaminerAccess).toHaveBeenCalledWith(examinerId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('revokeExaminerAccess', () => {
    it('should revoke examiner access', async () => {
      const examinerId = 'examiner_123';
      const expectedResult = {
        id: 'access_123',
        examinerId,
        isActive: false,
        validUntil: new Date(),
      };

      mockRegulatoryReportingService.revokeExaminerAccess.mockResolvedValue(expectedResult);

      const result = await controller.revokeExaminerAccess(examinerId);

      expect(service.revokeExaminerAccess).toHaveBeenCalledWith(examinerId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getComplianceConfig', () => {
    it('should return compliance configurations', async () => {
      const query = { regulatoryBody: RegulatoryBody.FINRA };
      const expectedResult = [
        {
          id: 'config_1',
          regulatoryBody: RegulatoryBody.FINRA,
          reportType: RegulatoryReportType.TRADE_REPORT,
          isActive: true,
          reportingFrequency: 'MONTHLY',
          submissionFormat: 'XML',
        },
      ];

      mockRegulatoryReportingService.getComplianceConfig.mockResolvedValue(expectedResult);

      const result = await controller.getComplianceConfig(query);

      expect(service.getComplianceConfig).toHaveBeenCalledWith(query.regulatoryBody);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateComplianceConfig', () => {
    it('should update compliance configuration', async () => {
      const configDto = {
        regulatoryBody: RegulatoryBody.FINRA,
        reportType: RegulatoryReportType.TRADE_REPORT,
        reportingFrequency: 'MONTHLY',
        submissionFormat: 'XML',
        notificationEmails: ['compliance@company.com'],
      };

      const expectedResult = {
        id: 'config_1',
        ...configDto,
        isActive: true,
        encryptionRequired: true,
        retentionPeriodYears: 7,
      };

      mockRegulatoryReportingService.updateComplianceConfig.mockResolvedValue(expectedResult);

      const result = await controller.updateComplianceConfig(configDto);

      expect(service.updateComplianceConfig).toHaveBeenCalledWith(configDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail', async () => {
      const query = {
        reportId: 'report_123',
        limit: 50,
        offset: 0,
      };

      const expectedResult = {
        auditTrail: [
          {
            id: 'audit_1',
            reportId: 'report_123',
            action: 'CREATED',
            createdAt: new Date(),
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      };

      mockRegulatoryReportingService.getAuditTrail.mockResolvedValue(expectedResult);

      const result = await controller.getAuditTrail(query);

      expect(service.getAuditTrail).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      const query = { period: '2024-01' };
      const expectedResult = {
        period: '2024-01',
        summary: {
          totalReports: 25,
          pendingReports: 3,
          submittedReports: 20,
          rejectedReports: 2,
        },
        recentSars: [
          {
            id: 'sar_1',
            reportType: RegulatoryReportType.SUSPICIOUS_ACTIVITY_REPORT,
            createdAt: new Date(),
          },
        ],
        largeTradeReports: [],
      };

      mockRegulatoryReportingService.getDashboard.mockResolvedValue(expectedResult);

      const result = await controller.getDashboard(query);

      expect(service.getDashboard).toHaveBeenCalledWith(query.period);
      expect(result).toEqual(expectedResult);
    });
  });
});
