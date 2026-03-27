import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegulatoryReportType, RegulatoryBody } from '@prisma/client';

@Injectable()
export class TradeReportingService {
  private readonly logger = new Logger(TradeReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateTradeReport(reportPeriod: string, format: string = 'FINRA_XML') {
    this.logger.log(`Generating trade report for period: ${reportPeriod} in format: ${format}`);

    // Get transactions for the period
    const startDate = this.getPeriodStartDate(reportPeriod);
    const endDate = this.getPeriodEndDate(reportPeriod);

    const transactions = await this.prisma.regulatoryTransaction.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Check for large trades (>10k USD)
    const largeTrades = transactions.filter(t => 
      t.usdValue && Number(t.usdValue) > 10000
    );

    // Create report
    const report = await this.prisma.regulatoryReport.create({
      data: {
        reportType: largeTrades.length > 0 
          ? RegulatoryReportType.LARGE_TRADE_REPORT 
          : RegulatoryReportType.TRADE_REPORT,
        regulatoryBody: RegulatoryBody.FINRA,
        status: 'PENDING',
        reportPeriod,
        reportData: {
          totalTransactions: transactions.length,
          largeTrades: largeTrades.length,
          volume: transactions.reduce((sum, t) => sum + Number(t.usdValue || 0), 0),
          format,
          summary: this.generateTradeSummary(transactions),
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          format,
          transactionCount: transactions.length,
          largeTradeCount: largeTrades.length,
        },
      },
    });

    // Create regulatory transactions
    if (transactions.length > 0) {
      await this.prisma.regulatoryTransaction.createMany({
        data: transactions.map(t => ({
          reportId: report.id,
          transactionHash: t.transactionHash,
          transactionType: t.transactionType,
          fromAddress: t.fromAddress,
          toAddress: t.toAddress,
          amount: t.amount,
          asset: t.asset,
          usdValue: t.usdValue,
          timestamp: t.timestamp,
          blockNumber: t.blockNumber,
          blockHash: t.blockHash,
          metadata: t.metadata,
          riskScore: t.riskScore,
          isSuspicious: t.isSuspicious,
          suspicionReason: t.suspicionReason,
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(`Trade report generated: ${report.id} with ${transactions.length} transactions`);

    return {
      report,
      summary: {
        period: reportPeriod,
        totalTransactions: transactions.length,
        largeTrades: largeTrades.length,
        format,
      },
    };
  }

  private getPeriodStartDate(reportPeriod: string): Date {
    // Handle different period formats: YYYY-MM, YYYY-Q1, YYYY
    if (reportPeriod.includes('-Q')) {
      // Quarterly format: 2024-Q1
      const [year, quarter] = reportPeriod.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      return new Date(parseInt(year), quarterStartMonth, 1);
    } else if (reportPeriod.length === 7) {
      // Monthly format: 2024-01
      return new Date(reportPeriod + '-01');
    } else if (reportPeriod.length === 4) {
      // Yearly format: 2024
      return new Date(reportPeriod + '-01-01');
    }
    return new Date(reportPeriod);
  }

  private getPeriodEndDate(reportPeriod: string): Date {
    const startDate = this.getPeriodStartDate(reportPeriod);
    
    if (reportPeriod.includes('-Q')) {
      // Quarterly - add 3 months
      return new Date(startDate.getFullYear(), startDate.getMonth() + 3, 1);
    } else if (reportPeriod.length === 7) {
      // Monthly - add 1 month
      return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    } else if (reportPeriod.length === 4) {
      // Yearly - add 1 year
      return new Date(startDate.getFullYear() + 1, 0, 1);
    }
    
    // Default to next day
    return new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  }

  private generateTradeSummary(transactions: any[]) {
    const summary = {
      totalVolume: 0,
      totalTransactions: transactions.length,
      uniqueAssets: new Set(transactions.map(t => t.asset)).size,
      uniqueAddresses: new Set([
        ...transactions.map(t => t.fromAddress),
        ...transactions.map(t => t.toAddress)
      ]).size,
      suspiciousTransactions: transactions.filter(t => t.isSuspicious).length,
      largeTransactions: transactions.filter(t => 
        t.usdValue && Number(t.usdValue) > 10000
      ).length,
    };

    transactions.forEach(t => {
      if (t.usdValue) {
        summary.totalVolume += Number(t.usdValue);
      }
    });

    return summary;
  }

  async generateFinraXmlReport(reportId: string): Promise<string> {
    const report = await this.prisma.regulatoryReport.findUnique({
      where: { id: reportId },
      include: { transactions: true },
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Generate FINRA XML format
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<FINRA_Trade_Report>
  <Header>
    <Report_ID>${report.id}</Report_ID>
    <Report_Period>${report.reportPeriod}</Report_Period>
    <Submission_Date>${new Date().toISOString()}</Submission_Date>
    <Firm_ID>STELLARA_EXCHANGE</Firm_ID>
  </Header>
  <Trade_Data>`;

    const tradeEntries = report.transactions.map(t => `
    <Trade>
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
    </Trade>`).join('');

    const xmlFooter = `
  </Trade_Data>
  <Summary>
    <Total_Trades>${report.transactions.length}</Total_Trades>
    <Total_Volume>${report.reportData?.volume || 0}</Total_Volume>
    <Suspicious_Trades>${report.reportData?.suspiciousTrades || 0}</Suspicious_Trades>
    <Large_Trades>${report.reportData?.largeTrades || 0}</Large_Trades>
  </Summary>
</FINRA_Trade_Report>`;

    return xmlHeader + tradeEntries + xmlFooter;
  }

  async detectLargeTrades(threshold: number = 10000, period?: string) {
    const where: any = {
      usdValue: { gte: threshold },
    };

    if (period) {
      const startDate = this.getPeriodStartDate(period);
      const endDate = this.getPeriodEndDate(period);
      where.timestamp = { gte: startDate, lt: endDate };
    }

    const largeTrades = await this.prisma.regulatoryTransaction.findMany({
      where,
      orderBy: { usdValue: 'desc' },
      take: 1000,
    });

    return {
      threshold,
      count: largeTrades.length,
      trades: largeTrades,
      period: period || 'all-time',
    };
  }
}
