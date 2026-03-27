import { Module } from '@nestjs/common';
import { RegulatoryReportingController } from './regulatory-reporting.controller';
import { RegulatoryReportingService } from './regulatory-reporting.service';
import { TradeReportingService } from './services/trade-reporting.service';
import { SuspiciousActivityService } from './services/suspicious-activity.service';
import { ComplianceReportingService } from './services/compliance-reporting.service';
import { ExaminerAccessService } from './services/examiner-access.service';
import { ReportGenerationService } from './services/report-generation.service';
import { NotificationService } from './services/notification.service';
import { AuditTrailService } from './services/audit-trail.service';

@Module({
  controllers: [RegulatoryReportingController],
  providers: [
    RegulatoryReportingService,
    TradeReportingService,
    SuspiciousActivityService,
    ComplianceReportingService,
    ExaminerAccessService,
    ReportGenerationService,
    NotificationService,
    AuditTrailService,
  ],
  exports: [
    RegulatoryReportingService,
    TradeReportingService,
    SuspiciousActivityService,
    ComplianceReportingService,
    ExaminerAccessService,
  ],
})
export class RegulatoryReportingModule {}
