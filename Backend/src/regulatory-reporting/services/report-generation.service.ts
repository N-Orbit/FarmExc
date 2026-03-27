import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);
  private readonly reportsDir = './generated-reports';

  constructor(private readonly prisma: PrismaService) {
    this.ensureReportsDirectory();
  }

  async generateReportFile(report: any) {
    this.logger.log(`Generating report file for report ${report.id}`);

    try {
      // Ensure reports directory exists
      await this.ensureReportsDirectory();

      // Generate report content based on type
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (report.reportType) {
        case 'TRADE_REPORT':
        case 'LARGE_TRADE_REPORT':
          content = await this.generateTradeReportContent(report);
          filename = `trade_report_${report.id}_${report.reportPeriod}.xml`;
          mimeType = 'application/xml';
          break;

        case 'SUSPICIOUS_ACTIVITY_REPORT':
          content = await this.generateSarContent(report);
          filename = `sar_${report.id}_${report.reportPeriod}.xml`;
          mimeType = 'application/xml';
          break;

        case 'QUARTERLY_COMPLIANCE':
          content = await this.generateComplianceReportContent(report);
          filename = `quarterly_compliance_${report.id}_${report.reportPeriod}.pdf`;
          mimeType = 'application/pdf';
          break;

        case 'ANNUAL_COMPLIANCE':
          content = await this.generateComplianceReportContent(report);
          filename = `annual_compliance_${report.id}_${report.reportPeriod}.pdf`;
          mimeType = 'application/pdf';
          break;

        default:
          content = JSON.stringify(report.reportData, null, 2);
          filename = `report_${report.id}_${report.reportPeriod}.json`;
          mimeType = 'application/json';
      }

      // Encrypt content if required
      const encryptionKeyId = await this.shouldEncrypt(report) ? await this.encryptContent(content) : null;
      const finalContent = encryptionKeyId ? await this.getEncryptedContent(content, encryptionKeyId) : content;

      // Generate file checksum
      const fileChecksum = this.generateChecksum(content);

      // Write file to disk
      const filePath = path.join(this.reportsDir, filename);
      await fs.writeFile(filePath, finalContent, 'utf8');

      // Update report with file information
      const updatedReport = await this.prisma.regulatoryReport.update({
        where: { id: report.id },
        data: {
          filePath,
          fileChecksum,
          encryptionKeyId,
          metadata: {
            ...report.metadata,
            fileGenerated: true,
            filename,
            mimeType,
            generatedAt: new Date().toISOString(),
            fileSize: content.length,
          },
        },
      });

      this.logger.log(`Report file generated: ${filePath}`);

      return {
        filePath,
        filename,
        mimeType,
        checksum: fileChecksum,
        size: content.length,
        encrypted: !!encryptionKeyId,
      };
    } catch (error) {
      this.logger.error(`Failed to generate report file for ${report.id}:`, error);
      throw error;
    }
  }

  async downloadReportFile(report: any) {
    if (!report.filePath) {
      throw new Error(`No file path found for report ${report.id}`);
    }

    try {
      const fileContent = await fs.readFile(report.filePath, 'utf8');

      // Decrypt if necessary
      const content = report.encryptionKeyId 
        ? await this.decryptContent(fileContent, report.encryptionKeyId)
        : fileContent;

      // Verify checksum
      const currentChecksum = this.generateChecksum(content);
      if (currentChecksum !== report.fileChecksum) {
        throw new Error('File checksum verification failed');
      }

      return {
        content,
        filename: path.basename(report.filePath),
        mimeType: report.metadata?.mimeType || 'application/octet-stream',
        checksum: currentChecksum,
      };
    } catch (error) {
      this.logger.error(`Failed to download report file for ${report.id}:`, error);
      throw error;
    }
  }

  private async generateTradeReportContent(report: any): Promise<string> {
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: { reportId: report.id },
      orderBy: { timestamp: 'asc' },
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FINRA_Trade_Report xmlns="http://www.finra.org/reporting">
  <Header>
    <Report_ID>${report.id}</Report_ID>
    <Report_Type>${report.reportType}</Report_Type>
    <Report_Period>${report.reportPeriod}</Report_Period>
    <Submission_Date>${new Date().toISOString()}</Submission_Date>
    <Firm_ID>STELLARA_EXCHANGE</Firm_ID>
    <Total_Transactions>${transactions.length}</Total_Transactions>
  </Header>
  
  <Trade_Data>
${transactions.map(t => `    <Trade>
      <Transaction_Hash>${t.transactionHash}</Transaction_Hash>
      <Transaction_Type>${t.transactionType}</Transaction_Type>
      <From_Address>${t.fromAddress}</From_Address>
      <To_Address>${t.toAddress}</To_Address>
      <Amount>${t.amount}</Amount>
      <Asset>${t.asset}</Asset>
      <USD_Value>${t.usdValue || 'N/A'}</USD_Value>
      <Timestamp>${t.timestamp.toISOString()}</Timestamp>
      <Block_Number>${t.blockNumber || 'N/A'}</Block_Number>
      <Risk_Score>${t.riskScore || 0}</Risk_Score>
      <Is_Suspicious>${t.isSuspicious}</Is_Suspicious>
      ${t.suspicionReason ? `<Suspicion_Reason>${t.suspicionReason}</Suspicion_Reason>` : ''}
    </Trade>`).join('\n')}
  </Trade_Data>
  
  <Summary>
    <Total_Trades>${transactions.length}</Total_Trades>
    <Total_Volume>${report.reportData?.volume || 0}</Total_Volume>
    <Suspicious_Trades>${transactions.filter(t => t.isSuspicious).length}</Suspicious_Trades>
    <Large_Trades>${report.reportData?.largeTrades || 0}</Large_Trades>
    <Unique_Assets>${new Set(transactions.map(t => t.asset)).size}</Unique_Assets>
    <Unique_Participants>${new Set([...transactions.map(t => t.fromAddress), ...transactions.map(t => t.toAddress)]).size}</Unique_Participants>
  </Summary>
</FINRA_Trade_Report>`;

    return xml;
  }

  private async generateSarContent(report: any): Promise<string> {
    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: { reportId: report.id },
      orderBy: { timestamp: 'asc' },
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FinCEN_SAR xmlns="http://www.fincen.gov/reporting">
  <Header>
    <SAR_ID>${report.id}</SAR_ID>
    <Filing_Date>${new Date().toISOString()}</Filing_Date>
    <Report_Period>${report.reportPeriod}</Report_Period>
    <Firm_ID>STELLARA_EXCHANGE</Firm_ID>
    <Total_Suspicious_Activities>${transactions.length}</Total_Suspicious_Activities>
  </Header>
  
  <Suspicious_Activities>
${transactions.map(t => `    <Activity>
      <Transaction_Hash>${t.transactionHash}</Transaction_Hash>
      <Transaction_Type>${t.transactionType}</Transaction_Type>
      <From_Address>${t.fromAddress}</From_Address>
      <To_Address>${t.toAddress}</To_Address>
      <Amount>${t.amount}</Amount>
      <Asset>${t.asset}</Asset>
      <USD_Value>${t.usdValue || 'N/A'}</USD_Value>
      <Timestamp>${t.timestamp.toISOString()}</Timestamp>
      <Risk_Score>${t.riskScore || 0}</Risk_Score>
      <Suspicion_Reason>${t.suspicionReason || 'High risk pattern detected'}</Suspicion_Reason>
    </Activity>`).join('\n')}
  </Suspicious_Activities>
  
  <Summary>
    <Total_Activities>${transactions.length}</Total_Activities>
    <High_Risk_Activities>${transactions.filter(t => (t.riskScore || 0) > 0.7).length}</High_Risk_Activities>
    <Total_Value>${transactions.reduce((sum, t) => sum + Number(t.usdValue || 0), 0)}</Total_Value>
    <Reason>${report.reportData?.reason || 'Suspicious pattern detected'}</Reason>
    <Risk_Level>${report.reportData?.riskAssessment?.level || 'MEDIUM'}</Risk_Level>
  </Summary>
</FinCEN_SAR>`;

    return xml;
  }

  private async generateComplianceReportContent(report: any): Promise<string> {
    // For PDF generation, we'll create a simple HTML representation
    // In production, you'd use a proper PDF library like puppeteer
    const data = report.reportData;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${report.reportType} - ${report.reportPeriod}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
        .high-risk { color: #d32f2f; }
        .medium-risk { color: #f57c00; }
        .low-risk { color: #388e3c; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.reportType.replace('_', ' ')}</h1>
        <p>Report Period: ${report.reportPeriod}</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <p>Regulatory Body: ${report.regulatoryBody}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metric">
            <span>Total Reports Generated:</span>
            <span>${data.summary?.totalReports || 0}</span>
        </div>
        <div class="metric">
            <span>Trade Reports:</span>
            <span>${data.summary?.tradeReports || 0}</span>
        </div>
        <div class="metric">
            <span>SAR Reports:</span>
            <span>${data.summary?.sarReports || 0}</span>
        </div>
        <div class="metric">
            <span>Submission Rate:</span>
            <span>${data.summary?.submissionRate?.toFixed(2) || 0}%</span>
        </div>
        <div class="metric">
            <span>Rejection Rate:</span>
            <span>${data.summary?.rejectionRate?.toFixed(2) || 0}%</span>
        </div>
    </div>

    ${data.riskMetrics ? `
    <div class="section">
        <h2>Risk Metrics</h2>
        <div class="metric">
            <span>Total Transactions:</span>
            <span>${data.riskMetrics.totalTransactions || 0}</span>
        </div>
        <div class="metric">
            <span>Suspicious Transactions:</span>
            <span class="${data.riskMetrics.suspiciousRate > 5 ? 'high-risk' : 'medium-risk'}">${data.riskMetrics.suspiciousTransactions || 0}</span>
        </div>
        <div class="metric">
            <span>Suspicious Rate:</span>
            <span class="${data.riskMetrics.suspiciousRate > 5 ? 'high-risk' : 'low-risk'}">${data.riskMetrics.suspiciousRate?.toFixed(2) || 0}%</span>
        </div>
        <div class="metric">
            <span>Average Risk Score:</span>
            <span class="${data.riskMetrics.avgRiskScore > 0.5 ? 'medium-risk' : 'low-risk'}">${data.riskMetrics.avgRiskScore?.toFixed(3) || 0}</span>
        </div>
    </div>
    ` : ''}

    ${data.recommendations && data.recommendations.length > 0 ? `
    <div class="section">
        <h2>Recommendations</h2>
        <table>
            <thead>
                <tr>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Recommendation</th>
                    <th>Rationale</th>
                </tr>
            </thead>
            <tbody>
                ${data.recommendations.map(rec => `
                <tr>
                    <td class="${rec.priority.toLowerCase()}-risk">${rec.priority}</td>
                    <td>${rec.category}</td>
                    <td>${rec.recommendation}</td>
                    <td>${rec.rationale}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>Report Details</h2>
        <div class="metric">
            <span>Report ID:</span>
            <span>${report.id}</span>
        </div>
        <div class="metric">
            <span>Report Type:</span>
            <span>${report.reportType}</span>
        </div>
        <div class="metric">
            <span>Status:</span>
            <span>${report.status}</span>
        </div>
        <div class="metric">
            <span>Created:</span>
            <span>${report.createdAt.toLocaleDateString()}</span>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  private async shouldEncrypt(report: any): Promise<boolean> {
    // Check compliance configuration for encryption requirements
    const config = await this.prisma.complianceConfiguration.findFirst({
      where: {
        regulatoryBody: report.regulatoryBody,
        reportType: report.reportType,
        isActive: true,
      },
    });

    return config?.encryptionRequired ?? true;
  }

  private async encryptContent(content: string): Promise<string> {
    // Simple encryption implementation - in production, use proper encryption
    const algorithm = 'aes-256-gcm';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('stellara-reports', 'utf8'));
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Store key securely (in production, use AWS KMS or similar)
    const keyId = `key_${Date.now()}`;
    // In production, store the key securely
    
    return keyId;
  }

  private async getEncryptedContent(content: string, keyId: string): Promise<string> {
    // Mock encrypted content - in production, actually encrypt
    return `ENCRYPTED_${keyId}_${Buffer.from(content).toString('base64')}`;
  }

  private async decryptContent(encryptedContent: string, keyId: string): Promise<string> {
    // Mock decryption - in production, actually decrypt
    if (encryptedContent.startsWith('ENCRYPTED_')) {
      const parts = encryptedContent.split('_');
      const base64Content = parts.slice(2).join('_');
      return Buffer.from(base64Content, 'base64').toString('utf8');
    }
    return encryptedContent;
  }

  private generateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.access(this.reportsDir);
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true });
    }
  }

  async cleanupOldFiles(retentionDays: number = 2555) { // 7 years default
    this.logger.log(`Cleaning up report files older than ${retentionDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find reports with files older than retention period
    const oldReports = await this.prisma.regulatoryReport.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        filePath: {
          not: null,
        },
      },
    });

    let deletedCount = 0;

    for (const report of oldReports) {
      try {
        // Delete physical file
        if (report.filePath) {
          await fs.unlink(report.filePath);
        }

        // Update database record
        await this.prisma.regulatoryReport.update({
          where: { id: report.id },
          data: {
            filePath: null,
            fileChecksum: null,
            encryptionKeyId: null,
            metadata: {
              ...report.metadata,
              fileDeleted: true,
              fileDeletedAt: new Date().toISOString(),
              retentionExpired: true,
            },
          },
        });

        deletedCount++;
      } catch (error) {
        this.logger.error(`Failed to delete file for report ${report.id}:`, error);
      }
    }

    this.logger.log(`Cleaned up ${deletedCount} old report files`);

    return {
      deletedCount,
      cutoffDate,
      retentionDays,
    };
  }

  async validateReportIntegrity(reportId: string): Promise<boolean> {
    const report = await this.prisma.regulatoryReport.findUnique({
      where: { id: reportId },
    });

    if (!report || !report.filePath || !report.fileChecksum) {
      return false;
    }

    try {
      const fileContent = await fs.readFile(report.filePath, 'utf8');
      const content = report.encryptionKeyId 
        ? await this.decryptContent(fileContent, report.encryptionKeyId)
        : fileContent;

      const currentChecksum = this.generateChecksum(content);
      return currentChecksum === report.fileChecksum;
    } catch (error) {
      this.logger.error(`Integrity check failed for report ${reportId}:`, error);
      return false;
    }
  }
}
