# Regulatory Reporting API Documentation

## Overview

The Regulatory Reporting API provides comprehensive financial compliance functionality including automated report generation, suspicious activity detection, examiner access management, and audit trail logging.

## Base URL
```
https://api.stellara.ai/regulatory-reporting
```

## Authentication

All endpoints require JWT authentication with the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow the standard format:
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Report Management

### Create Report

**POST** `/reports`

Create a new regulatory report.

**Request Body:**
```json
{
  "reportType": "TRADE_REPORT",
  "regulatoryBody": "FINRA",
  "reportPeriod": "2024-01",
  "reportData": {
    "customFields": { ... }
  },
  "metadata": {
    "source": "automated",
    "priority": "normal"
  },
  "tenantId": "tenant_123"
}
```

**Response:**
```json
{
  "data": {
    "id": "report_123",
    "reportType": "TRADE_REPORT",
    "regulatoryBody": "FINRA",
    "status": "PENDING",
    "reportPeriod": "2024-01",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Report created successfully"
}
```

### List Reports

**GET** `/reports`

Retrieve paginated list of reports with optional filtering.

**Query Parameters:**
- `reportType` (optional): Filter by report type
- `regulatoryBody` (optional): Filter by regulatory body
- `status` (optional): Filter by status
- `reportPeriod` (optional): Filter by period
- `tenantId` (optional): Filter by tenant
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": {
    "reports": [
      {
        "id": "report_123",
        "reportType": "TRADE_REPORT",
        "regulatoryBody": "FINRA",
        "status": "SUBMITTED",
        "reportPeriod": "2024-01",
        "submissionDate": "2024-01-15T10:30:00Z",
        "submissionId": "SUB_123456",
        "transactions": { ... },
        "_count": {
          "transactions": 150,
          "auditTrail": 12
        }
      }
    ],
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Report Details

**GET** `/reports/{id}`

Retrieve detailed information about a specific report.

**Path Parameters:**
- `id`: Report ID

**Response:**
```json
{
  "data": {
    "id": "report_123",
    "reportType": "TRADE_REPORT",
    "regulatoryBody": "FINRA",
    "status": "SUBMITTED",
    "reportPeriod": "2024-01",
    "reportData": { ... },
    "metadata": { ... },
    "filePath": "/reports/trade_report_123.xml",
    "fileChecksum": "sha256:abc123...",
    "submissionId": "SUB_123456",
    "submissionDate": "2024-01-15T10:30:00Z",
    "acceptanceDate": "2024-01-16T14:20:00Z",
    "transactions": [
      {
        "id": "tx_123",
        "transactionHash": "0x123...",
        "transactionType": "TRADE",
        "fromAddress": "0xabc...",
        "toAddress": "0xdef...",
        "amount": "1000",
        "asset": "BTC",
        "usdValue": "45000",
        "timestamp": "2024-01-10T15:30:00Z",
        "riskScore": 0.2,
        "isSuspicious": false
      }
    ],
    "auditTrail": [
      {
        "id": "audit_123",
        "action": "CREATED",
        "userId": "user_123",
        "createdAt": "2024-01-15T10:30:00Z",
        "details": { ... }
      }
    ]
  }
}
```

### Submit Report

**POST** `/reports/{id}/submit`

Submit a report to the regulatory body.

**Path Parameters:**
- `id`: Report ID

**Request Body:**
```json
{
  "submissionFormat": "XML",
  "priority": "HIGH",
  "additionalData": {
    "notes": "Urgent submission required"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "report_123",
    "status": "SUBMITTED",
    "submissionId": "SUB_123456",
    "submissionDate": "2024-01-15T10:30:00Z"
  },
  "message": "Report submitted successfully"
}
```

### Generate Report File

**POST** `/reports/{id}/generate`

Generate the actual report file for submission.

**Path Parameters:**
- `id`: Report ID

**Response:**
```json
{
  "data": {
    "filePath": "/reports/trade_report_123.xml",
    "filename": "trade_report_123_2024-01.xml",
    "mimeType": "application/xml",
    "checksum": "sha256:abc123...",
    "size": 15420,
    "encrypted": true
  },
  "message": "Report file generated successfully"
}
```

### Download Report

**GET** `/reports/{id}/download`

Download the generated report file.

**Path Parameters:**
- `id`: Report ID

**Response:**
- File download with appropriate headers
- Content-Type based on report format
- Content-Disposition with filename

## Report Generation

### Generate Trade Report

**POST** `/trade-reports`

Generate FINRA/NFA trade reports.

**Request Body:**
```json
{
  "reportPeriod": "2024-01",
  "format": "FINRA_XML",
  "includeTransactionTypes": ["TRADE", "DEPOSIT"],
  "filters": {
    "minAmount": 1000,
    "assets": ["BTC", "ETH"]
  }
}
```

**Response:**
```json
{
  "data": {
    "report": {
      "id": "trade_report_123",
      "reportType": "TRADE_REPORT",
      "regulatoryBody": "FINRA",
      "status": "PENDING"
    },
    "summary": {
      "period": "2024-01",
      "totalTransactions": 150,
      "largeTrades": 5,
      "format": "FINRA_XML",
      "volume": 2500000
    }
  },
  "message": "Trade report generated successfully"
}
```

### Generate Suspicious Activity Report

**POST** `/sar-reports`

Generate a Suspicious Activity Report (SAR).

**Request Body:**
```json
{
  "suspiciousActivityIds": ["activity_1", "activity_2", "activity_3"],
  "reason": "Unusual high-frequency trading pattern detected"
}
```

**Response:**
```json
{
  "data": {
    "report": {
      "id": "sar_123",
      "reportType": "SUSPICIOUS_ACTIVITY_REPORT",
      "regulatoryBody": "FINRA",
      "status": "PENDING"
    },
    "activities": 3,
    "summary": {
      "reportId": "sar_123",
      "suspiciousActivities": 3,
      "reason": "Unusual high-frequency trading pattern detected",
      "riskLevel": "HIGH"
    }
  },
  "message": "SAR generated successfully"
}
```

### Generate Compliance Report

**POST** `/compliance-reports`

Generate quarterly or annual compliance reports.

**Request Body:**
```json
{
  "reportType": "QUARTERLY",
  "period": "2024-Q1",
  "includeSections": ["SUMMARY", "RISK_METRICS", "RECOMMENDATIONS"],
  "customMetrics": {
    "additionalKPIs": { ... }
  }
}
```

**Response:**
```json
{
  "data": {
    "report": {
      "id": "compliance_123",
      "reportType": "QUARTERLY_COMPLIANCE",
      "regulatoryBody": "FINRA",
      "status": "PENDING"
    },
    "data": {
      "period": "2024-Q1",
      "quarter": "Q1",
      "year": "2024",
      "summary": {
        "totalReports": 25,
        "tradeReports": 15,
        "sarReports": 3,
        "submissionRate": 96.0,
        "rejectionRate": 4.0
      },
      "riskMetrics": { ... },
      "recommendations": [ ... ]
    }
  },
  "message": "Compliance report generated successfully"
}
```

## Suspicious Activity Detection

### Get Suspicious Activities

**GET** `/suspicious-activities`

Retrieve detected suspicious activities with filtering.

**Query Parameters:**
- `riskScoreMin` (optional): Minimum risk score (0-1)
- `transactionType` (optional): Filter by transaction type
- `period` (optional): Filter by time period
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "transactionHash": "0x123...",
        "transactionType": "TRADE",
        "fromAddress": "0xabc...",
        "toAddress": "0xdef...",
        "amount": "50000",
        "asset": "BTC",
        "riskScore": 0.85,
        "isSuspicious": true,
        "suspicionReason": "High-frequency trading pattern",
        "timestamp": "2024-01-10T15:30:00Z"
      }
    ],
    "total": 15,
    "limit": 100,
    "offset": 0
  }
}
```

### Detect Suspicious Patterns

**POST** `/detect-patterns`

Run suspicious pattern detection on transaction data.

**Request Body:**
```json
{
  "period": "2024-01",
  "patternTypes": ["HIGH_FREQUENCY", "UNUSUAL_AMOUNTS", "CIRCULAR"],
  "thresholds": {
    "highFrequencyMin": 100,
    "unusualAmountStdDev": 3
  }
}
```

**Response:**
```json
{
  "data": {
    "timestamp": "2024-01-15T10:30:00Z",
    "patterns": [
      {
        "type": "HIGH_FREQUENCY_TRADING",
        "detected": true,
        "count": 5,
        "details": [
          {
            "address": "0xabc...",
            "count": 150
          }
        ]
      }
    ],
    "summary": {
      "totalPatterns": 3,
      "highRiskActivities": 25
    }
  },
  "message": "Pattern detection completed"
}
```

## Examiner Access Management

### Grant Examiner Access

**POST** `/examiner-access`

Grant access to external examiners.

**Request Body:**
```json
{
  "examinerId": "examiner_123",
  "regulatoryBody": "FINRA",
  "accessLevel": "READ_ONLY",
  "permissions": [
    "VIEW_REPORTS",
    "DOWNLOAD_REPORTS",
    "VIEW_AUDIT_TRAIL"
  ],
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "tenantId": "tenant_123"
}
```

**Response:**
```json
{
  "data": {
    "id": "access_123",
    "examinerId": "examiner_123",
    "regulatoryBody": "FINRA",
    "accessLevel": "READ_ONLY",
    "permissions": ["VIEW_REPORTS", "DOWNLOAD_REPORTS", "VIEW_AUDIT_TRAIL"],
    "isActive": true,
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Examiner access granted successfully"
}
```

### Get Examiner Access Details

**GET** `/examiner-access/{examinerId}`

Retrieve examiner access information.

**Path Parameters:**
- `examinerId`: Examiner identifier

**Response:**
```json
{
  "data": {
    "id": "access_123",
    "examinerId": "examiner_123",
    "regulatoryBody": "FINRA",
    "accessLevel": "READ_ONLY",
    "permissions": ["VIEW_REPORTS", "DOWNLOAD_REPORTS"],
    "isActive": true,
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2024-12-31T23:59:59Z",
    "lastLoginAt": "2024-01-15T09:15:00Z",
    "ipAddress": "192.168.1.100"
  }
}
```

### Revoke Examiner Access

**POST** `/examiner-access/{examinerId}/revoke`

Revoke examiner access immediately.

**Path Parameters:**
- `examinerId`: Examiner identifier

**Response:**
```json
{
  "data": {
    "id": "access_123",
    "examinerId": "examiner_123",
    "isActive": false,
    "validUntil": "2024-01-15T10:30:00Z"
  },
  "message": "Examiner access revoked successfully"
}
```

### Examiner Dashboard

**GET** `/examiner/{examinerId}/dashboard`

Get examiner-specific dashboard data.

**Path Parameters:**
- `examinerId`: Examiner identifier

**Response:**
```json
{
  "data": {
    "examinerInfo": {
      "examinerId": "examiner_123",
      "regulatoryBody": "FINRA",
      "accessLevel": "READ_ONLY",
      "permissions": ["VIEW_REPORTS", "DOWNLOAD_REPORTS"],
      "validUntil": "2024-12-31T23:59:59Z",
      "lastLogin": "2024-01-15T09:15:00Z"
    },
    "recentReports": [
      {
        "id": "report_123",
        "reportType": "TRADE_REPORT",
        "status": "SUBMITTED",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "complianceMetrics": {
      "totalReports": 25,
      "pendingReports": 3,
      "submittedReports": 20,
      "submissionRate": 80.0
    }
  }
}
```

## Configuration Management

### Get Compliance Configuration

**GET** `/compliance-config`

Retrieve compliance configurations.

**Query Parameters:**
- `regulatoryBody` (optional): Filter by regulatory body

**Response:**
```json
{
  "data": [
    {
      "id": "config_123",
      "regulatoryBody": "FINRA",
      "reportType": "TRADE_REPORT",
      "isActive": true,
      "reportingFrequency": "MONTHLY",
      "submissionFormat": "XML",
      "thresholdRules": {
        "largeTradeThreshold": 10000,
        "suspiciousRiskThreshold": 0.7
      },
      "suspiciousPatterns": {
        "highFrequencyThreshold": 100,
        "unusualAmountStdDev": 3
      },
      "retentionPeriodYears": 7,
      "encryptionRequired": true,
      "notificationEmails": [
        "compliance@company.com",
        "legal@company.com"
      ],
      "lastReportPeriod": "2023-12"
    }
  ]
}
```

### Update Compliance Configuration

**POST** `/compliance-config`

Update or create compliance configuration.

**Request Body:**
```json
{
  "regulatoryBody": "FINRA",
  "reportType": "TRADE_REPORT",
  "isActive": true,
  "reportingFrequency": "MONTHLY",
  "submissionFormat": "XML",
  "thresholdRules": {
    "largeTradeThreshold": 10000,
    "suspiciousRiskThreshold": 0.7
  },
  "suspiciousPatterns": {
    "highFrequencyThreshold": 100,
    "unusualAmountStdDev": 3
  },
  "retentionPeriodYears": 7,
  "encryptionRequired": true,
  "notificationEmails": [
    "compliance@company.com",
    "legal@company.com"
  ],
  "tenantId": "tenant_123"
}
```

**Response:**
```json
{
  "data": {
    "id": "config_123",
    "regulatoryBody": "FINRA",
    "reportType": "TRADE_REPORT",
    "isActive": true,
    "reportingFrequency": "MONTHLY",
    "submissionFormat": "XML",
    "thresholdRules": { ... },
    "suspiciousPatterns": { ... },
    "retentionPeriodYears": 7,
    "encryptionRequired": true,
    "notificationEmails": ["compliance@company.com"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Compliance configuration updated successfully"
}
```

## Audit Trail

### Get Audit Trail

**GET** `/audit-trail`

Retrieve audit trail entries with filtering.

**Query Parameters:**
- `reportId` (optional): Filter by report ID
- `action` (optional): Filter by action type
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": {
    "auditTrail": [
      {
        "id": "audit_123",
        "reportId": "report_123",
        "action": "SUBMITTED",
        "userId": "user_123",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "details": {
          "submissionId": "SUB_123456",
          "regulatoryBody": "FINRA"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "report": {
          "id": "report_123",
          "reportType": "TRADE_REPORT",
          "regulatoryBody": "FINRA",
          "status": "SUBMITTED"
        }
      }
    ],
    "total": 50,
    "limit": 100,
    "offset": 0
  }
}
```

## Dashboard

### Get Dashboard Data

**GET** `/dashboard`

Retrieve regulatory reporting dashboard metrics.

**Query Parameters:**
- `period` (optional): Time period for metrics (default: current month)

**Response:**
```json
{
  "data": {
    "period": "2024-01",
    "summary": {
      "totalReports": 25,
      "pendingReports": 3,
      "submittedReports": 20,
      "rejectedReports": 2
    },
    "recentSars": [
      {
        "id": "sar_123",
        "reportType": "SUSPICIOUS_ACTIVITY_REPORT",
        "status": "SUBMITTED",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "largeTradeReports": [
      {
        "id": "large_trade_123",
        "reportType": "LARGE_TRADE_REPORT",
        "status": "PENDING",
        "createdAt": "2024-01-14T15:20:00Z"
      }
    ]
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Report generation**: 10 requests per minute
- **Bulk operations**: 5 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Webhooks

### Configure Webhook

Configure webhook endpoints for real-time notifications.

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhooks/regulatory",
  "events": [
    "report.submitted",
    "report.rejected",
    "sar.generated",
    "examiner.access.granted"
  ],
  "secret": "webhook_secret_123",
  "active": true
}
```

### Webhook Events

#### Report Submitted
```json
{
  "event": "report.submitted",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "reportId": "report_123",
    "reportType": "TRADE_REPORT",
    "regulatoryBody": "FINRA",
    "submissionId": "SUB_123456"
  }
}
```

#### SAR Generated
```json
{
  "event": "sar.generated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "sarId": "sar_123",
    "suspiciousActivities": 5,
    "riskLevel": "HIGH",
    "requiresImmediateAction": true
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { RegulatoryReportingAPI } from '@stellara/regulatory-reporting-sdk';

const api = new RegulatoryReportingAPI({
  baseURL: 'https://api.stellara.ai/regulatory-reporting',
  apiKey: 'your-api-key'
});

// Generate trade report
const tradeReport = await api.reports.generateTrade({
  reportPeriod: '2024-01',
  format: 'FINRA_XML'
});

// Submit report
await api.reports.submit(tradeReport.report.id);

// Get suspicious activities
const activities = await api.suspiciousActivities.list({
  riskScoreMin: 0.7,
  limit: 50
});
```

### Python
```python
from stellara_regulatory_reporting import RegulatoryReportingClient

client = RegulatoryReportingClient(
    base_url='https://api.stellara.ai/regulatory-reporting',
    api_key='your-api-key'
)

# Generate SAR
sar = client.reports.generate_sar(
    suspicious_activity_ids=['activity_1', 'activity_2'],
    reason='Unusual trading pattern detected'
)

# Grant examiner access
access = client.examiners.grant_access(
    examiner_id='examiner_123',
    regulatory_body='FINRA',
    access_level='READ_ONLY',
    permissions=['VIEW_REPORTS', 'DOWNLOAD_REPORTS']
)
```

## Support

For API support and questions:
- **Documentation**: https://docs.stellara.ai/regulatory-reporting
- **Support Email**: api-support@stellara.ai
- **Status Page**: https://status.stellara.ai
- **Developer Discord**: https://discord.gg/stellara
