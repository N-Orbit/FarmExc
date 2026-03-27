import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegulatoryBody } from '@prisma/client';
import { ExaminerAccessDto } from '../dto/regulatory-reporting.dto';

@Injectable()
export class ExaminerAccessService {
  private readonly logger = new Logger(ExaminerAccessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async grantAccess(accessDto: ExaminerAccessDto) {
    this.logger.log(`Granting examiner access to ${accessDto.examinerId} for ${accessDto.regulatoryBody}`);

    // Check if access already exists
    const existingAccess = await this.prisma.examinerAccess.findUnique({
      where: { examinerId: accessDto.examinerId },
    });

    if (existingAccess) {
      throw new BadRequestException(`Access already exists for examiner ${accessDto.examinerId}`);
    }

    // Validate access level and permissions
    this.validateAccessPermissions(accessDto.accessLevel, accessDto.permissions, accessDto.regulatoryBody);

    // Create examiner access
    const examinerAccess = await this.prisma.examinerAccess.create({
      data: {
        examinerId: accessDto.examinerId,
        regulatoryBody: accessDto.regulatoryBody,
        accessLevel: accessDto.accessLevel,
        permissions: accessDto.permissions,
        validFrom: new Date(accessDto.validFrom),
        validUntil: accessDto.validUntil ? new Date(accessDto.validUntil) : null,
        isActive: true,
        tenantId: accessDto.tenantId,
      },
    });

    this.logger.log(`Examiner access granted: ${examinerAccess.id}`);

    return examinerAccess;
  }

  async getAccess(examinerId: string) {
    const access = await this.prisma.examinerAccess.findUnique({
      where: { examinerId },
    });

    if (!access) {
      throw new NotFoundException(`Examiner access not found for ${examinerId}`);
    }

    // Check if access is still valid
    const now = new Date();
    if (access.validFrom > now || (access.validUntil && access.validUntil < now)) {
      throw new BadRequestException(`Access is not currently valid for examiner ${examinerId}`);
    }

    return access;
  }

  async revokeAccess(examinerId: string) {
    const access = await this.prisma.examinerAccess.findUnique({
      where: { examinerId },
    });

    if (!access) {
      throw new NotFoundException(`Examiner access not found for ${examinerId}`);
    }

    const updatedAccess = await this.prisma.examinerAccess.update({
      where: { examinerId },
      data: {
        isActive: false,
        validUntil: new Date(), // Set validUntil to now to immediately revoke
      },
    });

    this.logger.log(`Examiner access revoked: ${examinerId}`);

    return updatedAccess;
  }

  async validateAccess(examinerId: string, requiredPermission: string): Promise<boolean> {
    try {
      const access = await this.getAccess(examinerId);
      
      if (!access.isActive) {
        return false;
      }

      // Check if examiner has the required permission
      return access.permissions.includes(requiredPermission) || access.accessLevel === 'FULL_ACCESS';
    } catch (error) {
      return false;
    }
  }

  async listActiveExaminers(regulatoryBody?: RegulatoryBody) {
    const where: any = {
      isActive: true,
      validUntil: {
        gt: new Date(),
      },
    };

    if (regulatoryBody) {
      where.regulatoryBody = regulatoryBody;
    }

    return this.prisma.examinerAccess.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLastLogin(examinerId: string, ipAddress?: string) {
    return this.prisma.examinerAccess.update({
      where: { examinerId },
      data: {
        lastLoginAt: new Date(),
        ipAddress,
      },
    });
  }

  async extendAccess(examinerId: string, newValidUntil: string) {
    const access = await this.prisma.examinerAccess.findUnique({
      where: { examinerId },
    });

    if (!access) {
      throw new NotFoundException(`Examiner access not found for ${examinerId}`);
    }

    if (!access.isActive) {
      throw new BadRequestException(`Cannot extend access for inactive examiner ${examinerId}`);
    }

    const updatedAccess = await this.prisma.examinerAccess.update({
      where: { examinerId },
      data: {
        validUntil: new Date(newValidUntil),
        isActive: true, // Reactivate if expired
      },
    });

    this.logger.log(`Examiner access extended: ${examinerId} until ${newValidUntil}`);

    return updatedAccess;
  }

  async getAccessLogs(examinerId: string, limit: number = 50) {
    // Get examiner access details
    const access = await this.getAccess(examinerId);

    // Get audit trail for this examiner
    const auditLogs = await this.prisma.regulatoryAuditTrail.findMany({
      where: {
        report: {
          // This would need to be adjusted based on how we track examiner actions
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      examinerAccess: access,
      recentActivity: auditLogs,
      summary: {
        totalLogEntries: auditLogs.length,
        lastActivity: auditLogs[0]?.createdAt || null,
        accessLevel: access.accessLevel,
        permissions: access.permissions,
      },
    };
  }

  async cleanupExpiredAccess() {
    this.logger.log('Cleaning up expired examiner access');

    const expiredAccess = await this.prisma.examinerAccess.updateMany({
      where: {
        isActive: true,
        validUntil: {
          lt: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });

    this.logger.log(`Deactivated ${expiredAccess.count} expired examiner access records`);

    return expiredAccess;
  }

  private validateAccessPermissions(accessLevel: string, permissions: string[], regulatoryBody: RegulatoryBody) {
    const validAccessLevels = ['READ_ONLY', 'FULL_ACCESS'];
    if (!validAccessLevels.includes(accessLevel)) {
      throw new BadRequestException(`Invalid access level: ${accessLevel}`);
    }

    const validPermissions = this.getValidPermissions(regulatoryBody);
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    if (accessLevel === 'FULL_ACCESS' && permissions.length === 0) {
      // Full access should have all permissions
      throw new BadRequestException('Full access level requires explicit permissions');
    }
  }

  private getValidPermissions(regulatoryBody: RegulatoryBody): string[] {
    const basePermissions = [
      'VIEW_REPORTS',
      'DOWNLOAD_REPORTS',
      'VIEW_AUDIT_TRAIL',
      'VIEW_COMPLIANCE_METRICS',
    ];

    const bodySpecificPermissions: Record<RegulatoryBody, string[]> = {
      FINRA: [
        'VIEW_TRADE_REPORTS',
        'VIEW_SAR_REPORTS',
        'VIEW_LARGE_TRADE_REPORTS',
        'SUBMIT_REPORTS',
        'VIEW_EXAMINATION_NOTES',
      ],
      NFA: [
        'VIEW_COMPLIANCE_REPORTS',
        'VIEW_MEMBER_REPORTS',
        'VIEW_DISCIPLINARY_RECORDS',
        'SUBMIT_NFA_REPORTS',
      ],
      SEC: [
        'VIEW_SEC_FILINGS',
        'VIEW_INVESTIGATION_REPORTS',
        'VIEW_ENFORCEMENT_ACTIONS',
        'SUBMIT_SEC_REPORTS',
      ],
      CFTC: [
        'VIEW_DERIVATIVES_REPORTS',
        'VIEW_POSITION_REPORTS',
        'VIEW_LARGE_TRADER_REPORTS',
        'SUBMIT_CFTC_REPORTS',
      ],
      IRS: [
        'VIEW_TAX_REPORTS',
        'VIEW_1099_REPORTS',
        'VIEW_WITHHOLDING_REPORTS',
        'SUBMIT_IRS_REPORTS',
      ],
    };

    return [...basePermissions, ...(bodySpecificPermissions[regulatoryBody] || [])];
  }

  async createExaminerSession(examinerId: string, sessionData: any) {
    // This could be used to create temporary session tokens for examiners
    const session = {
      examinerId,
      sessionId: `EXAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      permissions: sessionData.permissions,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
    };

    // In a real implementation, this would be stored in Redis or a session store
    this.logger.log(`Created examiner session: ${session.sessionId} for ${examinerId}`);

    return session;
  }

  async validateExaminerSession(sessionId: string): Promise<boolean> {
    // In a real implementation, this would validate against a session store
    // For now, we'll just check the format
    return sessionId.startsWith('EXAM_') && sessionId.length > 20;
  }

  async getExaminerDashboard(examinerId: string) {
    const access = await this.getAccess(examinerId);
    
    // Get relevant data based on permissions
    const dashboardData: any = {
      examinerInfo: {
        examinerId: access.examinerId,
        regulatoryBody: access.regulatoryBody,
        accessLevel: access.accessLevel,
        permissions: access.permissions,
        validUntil: access.validUntil,
        lastLogin: access.lastLoginAt,
      },
    };

    if (access.permissions.includes('VIEW_REPORTS')) {
      const recentReports = await this.prisma.regulatoryReport.findMany({
        where: {
          regulatoryBody: access.regulatoryBody,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      dashboardData.recentReports = recentReports;
    }

    if (access.permissions.includes('VIEW_COMPLIANCE_METRICS')) {
      const [totalReports, pendingReports, submittedReports] = await Promise.all([
        this.prisma.regulatoryReport.count({
          where: { regulatoryBody: access.regulatoryBody },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            regulatoryBody: access.regulatoryBody,
            status: 'PENDING',
          },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            regulatoryBody: access.regulatoryBody,
            status: 'SUBMITTED',
          },
        }),
      ]);

      dashboardData.complianceMetrics = {
        totalReports,
        pendingReports,
        submittedReports,
        submissionRate: totalReports > 0 ? (submittedReports / totalReports) * 100 : 0,
      };
    }

    return dashboardData;
  }
}
