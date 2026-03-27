import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendReportSubmissionNotification(report: any) {
    this.logger.log(`Sending report submission notification for ${report.id}`);

    try {
      // Get compliance configuration for notification emails
      const config = await this.prisma.complianceConfiguration.findFirst({
        where: {
          regulatoryBody: report.regulatoryBody,
          reportType: report.reportType,
          isActive: true,
        },
      });

      if (!config || !config.notificationEmails || config.notificationEmails.length === 0) {
        this.logger.warn(`No notification emails configured for ${report.regulatoryBody} ${report.reportType}`);
        return { status: 'skipped', reason: 'No notification emails configured' };
      }

      // Prepare notification content
      const notificationData = {
        to: config.notificationEmails,
        subject: `Regulatory Report Submitted: ${report.reportType} - ${report.reportPeriod}`,
        template: 'report-submission',
        data: {
          reportId: report.id,
          reportType: report.reportType,
          regulatoryBody: report.regulatoryBody,
          reportPeriod: report.reportPeriod,
          submissionDate: report.submissionDate,
          submissionId: report.submissionId,
          dashboardUrl: `${process.env.BASE_URL}/regulatory-reports/${report.id}`,
        },
      };

      // Send notification (mock implementation)
      const result = await this.sendEmail(notificationData);

      this.logger.log(`Report submission notification sent: ${result.messageId}`);

      return {
        status: 'sent',
        messageId: result.messageId,
        recipients: config.notificationEmails,
      };
    } catch (error) {
      this.logger.error(`Failed to send report submission notification for ${report.id}:`, error);
      throw error;
    }
  }

  async sendSuspiciousActivityAlert(sarReport: any, suspiciousActivities: any[]) {
    this.logger.log(`Sending suspicious activity alert for SAR ${sarReport.id}`);

    try {
      // Get compliance configuration for SAR notifications
      const config = await this.prisma.complianceConfiguration.findFirst({
        where: {
          regulatoryBody: sarReport.regulatoryBody,
          reportType: 'SUSPICIOUS_ACTIVITY_REPORT',
          isActive: true,
        },
      });

      if (!config || !config.notificationEmails || config.notificationEmails.length === 0) {
        this.logger.warn(`No notification emails configured for SAR alerts`);
        return { status: 'skipped', reason: 'No notification emails configured' };
      }

      // Prepare high-priority alert
      const notificationData = {
        to: config.notificationEmails,
        subject: `URGENT: Suspicious Activity Report Generated - ${sarReport.id}`,
        template: 'sar-alert',
        priority: 'high',
        data: {
          sarId: sarReport.id,
          reportPeriod: sarReport.reportPeriod,
          suspiciousCount: suspiciousActivities.length,
          highRiskCount: suspiciousActivities.filter(a => (a.riskScore || 0) > 0.7).length,
          reason: sarReport.reportData?.reason || 'Suspicious pattern detected',
          riskLevel: sarReport.reportData?.riskAssessment?.level || 'MEDIUM',
          dashboardUrl: `${process.env.BASE_URL}/regulatory-reports/${sarReport.id}`,
          requiresImmediateAction: sarReport.reportData?.riskAssessment?.level === 'HIGH',
        },
      };

      // Send high-priority notification
      const result = await this.sendEmail(notificationData);

      // Also send SMS for high-risk cases
      if (sarReport.reportData?.riskAssessment?.level === 'HIGH') {
        await this.sendSmsAlert({
          to: config.notificationEmails, // In production, these would be phone numbers
          message: `URGENT: High-risk SAR generated. Review immediately: ${process.env.BASE_URL}/regulatory-reports/${sarReport.id}`,
        });
      }

      this.logger.log(`Suspicious activity alert sent: ${result.messageId}`);

      return {
        status: 'sent',
        messageId: result.messageId,
        recipients: config.notificationEmails,
        priority: 'high',
      };
    } catch (error) {
      this.logger.error(`Failed to send suspicious activity alert for ${sarReport.id}:`, error);
      throw error;
    }
  }

  async sendComplianceDeadlineReminder(reportType: string, deadlineDate: Date, regulatoryBody: string) {
    this.logger.log(`Sending compliance deadline reminder for ${reportType}`);

    try {
      const config = await this.prisma.complianceConfiguration.findFirst({
        where: {
          regulatoryBody,
          reportType,
          isActive: true,
        },
      });

      if (!config || !config.notificationEmails || config.notificationEmails.length === 0) {
        return { status: 'skipped', reason: 'No notification emails configured' };
      }

      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      const notificationData = {
        to: config.notificationEmails,
        subject: `Compliance Deadline Reminder: ${reportType} - ${daysUntilDeadline} days remaining`,
        template: 'deadline-reminder',
        priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
        data: {
          reportType,
          regulatoryBody,
          deadlineDate: deadlineDate.toISOString(),
          daysUntilDeadline,
          urgencyLevel: daysUntilDeadline <= 3 ? 'critical' : daysUntilDeadline <= 7 ? 'warning' : 'info',
          dashboardUrl: `${process.env.BASE_URL}/regulatory-reports`,
        },
      };

      const result = await this.sendEmail(notificationData);

      this.logger.log(`Compliance deadline reminder sent: ${result.messageId}`);

      return {
        status: 'sent',
        messageId: result.messageId,
        recipients: config.notificationEmails,
        daysUntilDeadline,
      };
    } catch (error) {
      this.logger.error(`Failed to send compliance deadline reminder:`, error);
      throw error;
    }
  }

  async sendReportRejectionNotification(report: any, rejectionReason: string) {
    this.logger.log(`Sending report rejection notification for ${report.id}`);

    try {
      const config = await this.prisma.complianceConfiguration.findFirst({
        where: {
          regulatoryBody: report.regulatoryBody,
          reportType: report.reportType,
          isActive: true,
        },
      });

      if (!config || !config.notificationEmails || config.notificationEmails.length === 0) {
        return { status: 'skipped', reason: 'No notification emails configured' };
      }

      const notificationData = {
        to: config.notificationEmails,
        subject: `URGENT: Regulatory Report Rejected - ${report.reportType} - ${report.reportPeriod}`,
        template: 'report-rejection',
        priority: 'high',
        data: {
          reportId: report.id,
          reportType: report.reportType,
          regulatoryBody: report.regulatoryBody,
          reportPeriod: report.reportPeriod,
          rejectionReason,
          submissionDate: report.submissionDate,
          dashboardUrl: `${process.env.BASE_URL}/regulatory-reports/${report.id}/edit`,
          requiresImmediateAction: true,
        },
      };

      const result = await this.sendEmail(notificationData);

      this.logger.log(`Report rejection notification sent: ${result.messageId}`);

      return {
        status: 'sent',
        messageId: result.messageId,
        recipients: config.notificationEmails,
        priority: 'high',
      };
    } catch (error) {
      this.logger.error(`Failed to send report rejection notification for ${report.id}:`, error);
      throw error;
    }
  }

  async sendExaminerAccessNotification(examinerAccess: any, action: 'granted' | 'revoked') {
    this.logger.log(`Sending examiner access notification: ${action} for ${examinerAccess.examinerId}`);

    try {
      const config = await this.prisma.complianceConfiguration.findFirst({
        where: {
          regulatoryBody: examinerAccess.regulatoryBody,
          isActive: true,
        },
      });

      if (!config || !config.notificationEmails || config.notificationEmails.length === 0) {
        return { status: 'skipped', reason: 'No notification emails configured' };
      }

      const notificationData = {
        to: config.notificationEmails,
        subject: `Examiner Access ${action.charAt(0).toUpperCase() + action.slice(1)}: ${examinerAccess.examinerId}`,
        template: 'examiner-access',
        priority: 'medium',
        data: {
          examinerId: examinerAccess.examinerId,
          regulatoryBody: examinerAccess.regulatoryBody,
          accessLevel: examinerAccess.accessLevel,
          permissions: examinerAccess.permissions,
          validFrom: examinerAccess.validFrom,
          validUntil: examinerAccess.validUntil,
          action,
          ipAddress: examinerAccess.ipAddress,
          dashboardUrl: `${process.env.BASE_URL}/regulatory-reports/examiner-access`,
        },
      };

      const result = await this.sendEmail(notificationData);

      this.logger.log(`Examiner access notification sent: ${result.messageId}`);

      return {
        status: 'sent',
        messageId: result.messageId,
        recipients: config.notificationEmails,
        action,
      };
    } catch (error) {
      this.logger.error(`Failed to send examiner access notification:`, error);
      throw error;
    }
  }

  async sendWeeklyComplianceSummary() {
    this.logger.log('Sending weekly compliance summary');

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const [
        totalReports,
        submittedReports,
        rejectedReports,
        sarReports,
        highRiskActivities,
      ] = await Promise.all([
        this.prisma.regulatoryReport.count({
          where: { createdAt: { gte: startDate } },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            createdAt: { gte: startDate },
            status: 'SUBMITTED',
          },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            createdAt: { gte: startDate },
            status: 'REJECTED',
          },
        }),
        this.prisma.regulatoryReport.count({
          where: {
            createdAt: { gte: startDate },
            reportType: 'SUSPICIOUS_ACTIVITY_REPORT',
          },
        }),
        this.prisma.regulatoryTransaction.count({
          where: {
            createdAt: { gte: startDate },
            isSuspicious: true,
          },
        }),
      ]);

      // Get all active compliance configurations to notify
      const configs = await this.prisma.complianceConfiguration.findMany({
        where: { isActive: true },
        distinct: ['notificationEmails'],
      });

      const allEmails = [...new Set(configs.flatMap(c => c.notificationEmails || []))];

      if (allEmails.length === 0) {
        return { status: 'skipped', reason: 'No notification emails configured' };
      }

      const notificationData = {
        to: allEmails,
        subject: `Weekly Compliance Summary - ${new Date().toLocaleDateString()}`,
        template: 'weekly-summary',
        priority: 'low',
        data: {
          weekStart: startDate.toISOString(),
          weekEnd: new Date().toISOString(),
          totalReports,
          submittedReports,
          rejectedReports,
          sarReports,
          highRiskActivities,
          submissionRate: totalReports > 0 ? ((submittedReports / totalReports) * 100).toFixed(2) : '0',
          rejectionRate: totalReports > 0 ? ((rejectedReports / totalReports) * 100).toFixed(2) : '0',
          dashboardUrl: `${process.env.BASE_URL}/regulatory-reports/dashboard`,
        },
      };

      const result = await this.sendEmail(notificationData);

      this.logger.log(`Weekly compliance summary sent: ${result.messageId}`);

      return {
        status: 'sent',
        messageId: result.messageId,
        recipients: allEmails,
        summary: {
          totalReports,
          submittedReports,
          rejectedReports,
          sarReports,
          highRiskActivities,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send weekly compliance summary:`, error);
      throw error;
    }
  }

  private async sendEmail(data: any): Promise<{ messageId: string }> {
    // Mock email implementation - in production, integrate with SendGrid, AWS SES, etc.
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`Email sent: ${data.subject} to ${data.to.join(', ')}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { messageId };
  }

  private async sendSmsAlert(data: any): Promise<{ messageId: string }> {
    // Mock SMS implementation - in production, integrate with Twilio
    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`SMS sent to ${data.to}: ${data.message}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return { messageId };
  }

  async createNotificationTemplate(templateName: string, template: any) {
    // Store notification templates (in production, this would be in a database)
    this.logger.log(`Creating notification template: ${templateName}`);
    
    return {
      templateName,
      created: true,
      template,
    };
  }

  async getNotificationHistory(filters: any) {
    // Mock notification history - in production, this would query a notification log table
    const history = [
      {
        id: 'notif_1',
        type: 'email',
        template: 'report-submission',
        recipients: ['compliance@company.com'],
        subject: 'Regulatory Report Submitted',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'sent',
        messageId: 'email_123456',
      },
      {
        id: 'notif_2',
        type: 'email',
        template: 'sar-alert',
        recipients: ['compliance@company.com', 'legal@company.com'],
        subject: 'URGENT: Suspicious Activity Report Generated',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'sent',
        messageId: 'email_789012',
        priority: 'high',
      },
    ];

    return {
      notifications: history.slice(0, filters.limit || 50),
      total: history.length,
    };
  }
}
