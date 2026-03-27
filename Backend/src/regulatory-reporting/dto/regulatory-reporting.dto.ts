import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RegulatoryReportType, RegulatoryReportStatus, RegulatoryBody } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(RegulatoryReportType)
  reportType: RegulatoryReportType;

  @IsEnum(RegulatoryBody)
  regulatoryBody: RegulatoryBody;

  @IsString()
  reportPeriod: string; // YYYY-MM, YYYY-Q1, etc.

  @IsOptional()
  @IsObject()
  reportData?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class SubmitReportDto {
  @IsOptional()
  @IsString()
  submissionFormat?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsObject()
  additionalData?: any;
}

export class GetReportsDto {
  @IsOptional()
  @IsEnum(RegulatoryReportType)
  reportType?: RegulatoryReportType;

  @IsOptional()
  @IsEnum(RegulatoryBody)
  regulatoryBody?: RegulatoryBody;

  @IsOptional()
  @IsEnum(RegulatoryReportStatus)
  status?: RegulatoryReportStatus;

  @IsOptional()
  @IsString()
  reportPeriod?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number = 0;
}

export class ExaminerAccessDto {
  @IsString()
  examinerId: string;

  @IsEnum(RegulatoryBody)
  regulatoryBody: RegulatoryBody;

  @IsString()
  accessLevel: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ComplianceConfigDto {
  @IsEnum(RegulatoryBody)
  regulatoryBody: RegulatoryBody;

  @IsEnum(RegulatoryReportType)
  reportType: RegulatoryReportType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsString()
  reportingFrequency: string;

  @IsString()
  submissionFormat: string;

  @IsOptional()
  @IsObject()
  thresholdRules?: any;

  @IsOptional()
  @IsObject()
  suspiciousPatterns?: any;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  retentionPeriodYears?: number = 7;

  @IsOptional()
  @IsBoolean()
  encryptionRequired?: boolean = true;

  @IsArray()
  @IsString({ each: true })
  notificationEmails: string[];

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class SuspiciousActivityDto {
  @IsString()
  transactionHash: string;

  @IsString()
  reason: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsObject()
  evidence?: any;
}

export class TradeReportDto {
  @IsString()
  reportPeriod: string;

  @IsOptional()
  @IsString()
  format?: string = 'FINRA_XML';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeTransactionTypes?: string[];

  @IsOptional()
  @IsObject()
  filters?: any;
}

export class QuarterlyComplianceDto {
  @IsString()
  quarter: string; // 2024-Q1, 2024-Q2, etc.

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeSections?: string[];

  @IsOptional()
  @IsObject()
  customMetrics?: any;
}
