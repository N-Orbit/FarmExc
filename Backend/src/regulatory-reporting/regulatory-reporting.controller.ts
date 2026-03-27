import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegulatoryReportingService } from './regulatory-reporting.service';
import {
  CreateReportDto,
  SubmitReportDto,
  GetReportsDto,
  ExaminerAccessDto,
  ComplianceConfigDto,
} from './dto/regulatory-reporting.dto';

@ApiTags('Regulatory Reporting')
@Controller('regulatory-reporting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegulatoryReportingController {
  constructor(private readonly regulatoryReportingService: RegulatoryReportingService) {}

  @Post('reports')
  @ApiOperation({ summary: 'Create a new regulatory report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(@Body() createReportDto: CreateReportDto, @Request() req) {
    return this.regulatoryReportingService.createReport(createReportDto, req.user.id);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List regulatory reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReports(@Query() query: GetReportsDto) {
    return this.regulatoryReportingService.getReports(query);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get specific regulatory report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getReport(@Param('id') id: string) {
    return this.regulatoryReportingService.getReport(id);
  }

  @Post('reports/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit report to regulatory body' })
  @ApiResponse({ status: 200, description: 'Report submitted successfully' })
  async submitReport(@Param('id') id: string, @Body() submitDto: SubmitReportDto, @Request() req) {
    return this.regulatoryReportingService.submitReport(id, submitDto, req.user.id);
  }

  @Post('reports/:id/generate')
  @ApiOperation({ summary: 'Generate report file' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async generateReport(@Param('id') id: string) {
    return this.regulatoryReportingService.generateReportFile(id);
  }

  @Get('reports/:id/download')
  @ApiOperation({ summary: 'Download report file' })
  @ApiResponse({ status: 200, description: 'Report downloaded successfully' })
  async downloadReport(@Param('id') id: string) {
    return this.regulatoryReportingService.downloadReport(id);
  }

  @Post('trade-reports')
  @ApiOperation({ summary: 'Generate FINRA/NFA trade reports' })
  @ApiResponse({ status: 201, description: 'Trade report created successfully' })
  async generateTradeReport(@Body() body: { reportPeriod: string; format?: string }) {
    return this.regulatoryReportingService.generateTradeReport(body.reportPeriod, body.format);
  }

  @Post('sar-reports')
  @ApiOperation({ summary: 'Generate Suspicious Activity Reports' })
  @ApiResponse({ status: 201, description: 'SAR created successfully' })
  async generateSar(@Body() body: { suspiciousActivityIds: string[]; reason: string }) {
    return this.regulatoryReportingService.generateSar(body.suspiciousActivityIds, body.reason);
  }

  @Post('compliance-reports')
  @ApiOperation({ summary: 'Generate quarterly/annual compliance reports' })
  @ApiResponse({ status: 201, description: 'Compliance report created successfully' })
  async generateComplianceReport(@Body() body: { reportType: string; period: string }) {
    return this.regulatoryReportingService.generateComplianceReport(body.reportType, body.period);
  }

  @Get('suspicious-activities')
  @ApiOperation({ summary: 'Get detected suspicious activities' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  async getSuspiciousActivities(@Query() query: any) {
    return this.regulatoryReportingService.getSuspiciousActivities(query);
  }

  @Post('examiner-access')
  @ApiOperation({ summary: 'Grant examiner access' })
  @ApiResponse({ status: 201, description: 'Access granted successfully' })
  async grantExaminerAccess(@Body() accessDto: ExaminerAccessDto) {
    return this.regulatoryReportingService.grantExaminerAccess(accessDto);
  }

  @Get('examiner-access/:examinerId')
  @ApiOperation({ summary: 'Get examiner access details' })
  @ApiResponse({ status: 200, description: 'Access details retrieved successfully' })
  async getExaminerAccess(@Param('examinerId') examinerId: string) {
    return this.regulatoryReportingService.getExaminerAccess(examinerId);
  }

  @Post('examiner-access/:examinerId/revoke')
  @ApiOperation({ summary: 'Revoke examiner access' })
  @ApiResponse({ status: 200, description: 'Access revoked successfully' })
  async revokeExaminerAccess(@Param('examinerId') examinerId: string) {
    return this.regulatoryReportingService.revokeExaminerAccess(examinerId);
  }

  @Get('compliance-config')
  @ApiOperation({ summary: 'Get compliance configurations' })
  @ApiResponse({ status: 200, description: 'Configurations retrieved successfully' })
  async getComplianceConfig(@Query() query: { regulatoryBody?: string }) {
    return this.regulatoryReportingService.getComplianceConfig(query.regulatoryBody);
  }

  @Post('compliance-config')
  @ApiOperation({ summary: 'Update compliance configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateComplianceConfig(@Body() configDto: ComplianceConfigDto) {
    return this.regulatoryReportingService.updateComplianceConfig(configDto);
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'Get regulatory audit trail' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved successfully' })
  async getAuditTrail(@Query() query: { reportId?: string; limit?: number; offset?: number }) {
    return this.regulatoryReportingService.getAuditTrail(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get regulatory reporting dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Query() query: { period?: string }) {
    return this.regulatoryReportingService.getDashboard(query.period);
  }
}
