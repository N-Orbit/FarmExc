# Customer Data Platform (CDP) API Documentation

## Overview

The Customer Data Platform API provides comprehensive customer data management including event ingestion, identity resolution, segmentation, consent management, and real-time personalization.

## Base URL
```
https://api.stellara.ai/cdp
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

## Event Ingestion

### Ingest Event

**POST** `/events`

Ingest customer events from any source (web, mobile, backend).

**Request Body:**
```json
{
  "anonymousId": "anon_123456",
  "userId": "user_789",
  "type": "PAGE_VIEW",
  "source": "WEB",
  "eventName": "homepage_visit",
  "properties": {
    "page": "/home",
    "referrer": "https://google.com",
    "utm_source": "google",
    "utm_medium": "cpc"
  },
  "sessionId": "session_123",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenantId": "tenant_123"
}
```

**Response:**
```json
{
  "data": {
    "eventId": "event_123",
    "status": "processed"
  },
  "message": "Event ingested successfully"
}
```

### Bulk Event Ingestion

**POST** `/events/bulk`

Ingest multiple events in a single request.

**Request Body:**
```json
{
  "events": [
    {
      "anonymousId": "anon_123",
      "type": "PAGE_VIEW",
      "source": "WEB",
      "eventName": "product_view",
      "properties": { "productId": "prod_123" },
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "userId": "user_789",
      "type": "CLICK",
      "source": "WEB",
      "eventName": "add_to_cart",
      "properties": { "productId": "prod_123", "quantity": 1 },
      "timestamp": "2024-01-15T10:31:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "processed": 2,
    "failed": 0,
    "eventIds": ["event_123", "event_124"]
  },
  "message": "Bulk events processed successfully"
}
```

## User Profiles

### Get User Profile

**GET** `/users/{userId}/profile`

Retrieve comprehensive 360-degree user profile.

**Path Parameters:**
- `userId`: User identifier

**Response:**
```json
{
  "data": {
    "userId": "user_789",
    "email": "john@example.com",
    "phone": "+1234567890",
    "walletAddress": "0x123...",
    "profileData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "location": "New York, NY",
      "preferences": {
        "language": "en",
        "timezone": "America/New_York"
      }
    },
    "segments": [
      {
        "id": "segment_123",
        "name": "High Value Customers",
        "type": "BEHAVIORAL",
        "joinedAt": "2024-01-10T15:30:00Z"
      }
    ],
    "consent": [
      {
        "type": "MARKETING",
        "channel": "email",
        "granted": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "eventCount": 150,
    "lastActivity": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update User Profile

**PUT** `/users/{userId}/profile`

Update user profile information.

**Path Parameters:**
- `userId`: User identifier

**Request Body:**
```json
{
  "profileData": {
    "firstName": "John",
    "lastName": "Smith",
    "age": 31,
    "location": "Boston, MA",
    "preferences": {
      "language": "en",
      "timezone": "America/New_York",
      "notifications": true
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "userId": "user_789",
    "profileData": { ... },
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "User profile updated successfully"
}
```

### Get User Activity History

**GET** `/users/{userId}/activities`

Retrieve user's activity history with pagination.

**Path Parameters:**
- `userId`: User identifier

**Query Parameters:**
- `eventType` (optional): Filter by event type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": {
    "activities": [
      {
        "id": "event_123",
        "type": "PAGE_VIEW",
        "source": "WEB",
        "eventName": "product_view",
        "properties": { "productId": "prod_123" },
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

## Segmentation

### List Segments

**GET** `/segments`

Retrieve all available segments.

**Query Parameters:**
- `type` (optional): Filter by segment type
- `isActive` (optional): Filter by active status
- `tenantId` (optional): Filter by tenant

**Response:**
```json
{
  "data": [
    {
      "id": "segment_123",
      "name": "High Value Customers",
      "description": "Customers with lifetime value > $1000",
      "type": "BEHAVIORAL",
      "sqlQuery": "SELECT * FROM users WHERE lifetime_value > 1000",
      "visualConfig": { ... },
      "conditions": [ ... ],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "_count": {
        "memberships": 250
      }
    }
  ]
}
```

### Create Segment

**POST** `/segments`

Create a new customer segment.

**Request Body:**
```json
{
  "name": "Recent Purchasers",
  "description": "Customers who purchased in the last 30 days",
  "type": "SQL",
  "sqlQuery": "SELECT user_id FROM events WHERE type = 'PURCHASE' AND timestamp >= NOW() - INTERVAL '30 days'",
  "visualConfig": null,
  "conditions": null,
  "tenantId": "tenant_123"
}
```

**Response:**
```json
{
  "data": {
    "id": "segment_124",
    "name": "Recent Purchasers",
    "description": "Customers who purchased in the last 30 days",
    "type": "SQL",
    "sqlQuery": "SELECT user_id FROM events WHERE type = 'PURCHASE' AND timestamp >= NOW() - INTERVAL '30 days'",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Segment created successfully"
}
```

### Create Visual Segment

**POST** `/segments/visual`

Create a segment using visual builder.

**Request Body:**
```json
{
  "name": "Mobile Engaged Users",
  "description": "Users with high mobile engagement",
  "type": "VISUAL",
  "visualConfig": {
    "rules": [
      {
        "field": "device_type",
        "operator": "equals",
        "value": "mobile"
      },
      {
        "field": "session_duration",
        "operator": "greater_than",
        "value": 300
      }
    ],
    "logic": "AND"
  },
  "tenantId": "tenant_123"
}
```

**Response:**
```json
{
  "data": {
    "id": "segment_125",
    "name": "Mobile Engaged Users",
    "type": "VISUAL",
    "visualConfig": { ... },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Visual segment created successfully"
}
```

### Get Segment Users

**GET** `/segments/{segmentId}/users`

Retrieve users in a specific segment.

**Path Parameters:**
- `segmentId`: Segment identifier

**Query Parameters:**
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": {
    "users": [
      {
        "userId": "user_789",
        "email": "john@example.com",
        "joinedAt": "2024-01-10T15:30:00Z"
      }
    ],
    "total": 250,
    "limit": 100,
    "offset": 0
  }
}
```

### Evaluate Segment

**POST** `/segments/{segmentId}/evaluate`

Manually trigger segment evaluation and membership updates.

**Path Parameters:**
- `segmentId`: Segment identifier

**Response:**
```json
{
  "data": {
    "segmentId": "segment_123",
    "evaluationId": "eval_123",
    "status": "completed",
    "updates": {
      "added": 15,
      "removed": 5,
      "total": 250
    },
    "duration": 2500
  },
  "message": "Segment evaluation completed"
}
```

### Activate Segment

**POST** `/segments/{segmentId}/activate`

Activate segment for integrations (email, push, etc.).

**Path Parameters:**
- `segmentId`: Segment identifier

**Request Body:**
```json
{
  "integrations": ["sendgrid", "onesignal", "webhook"]
}
```

**Response:**
```json
{
  "data": {
    "segmentId": "segment_123",
    "integrations": [
      {
        "integration": "sendgrid",
        "status": "success",
        "message": "Activated successfully"
      },
      {
        "integration": "onesignal",
        "status": "success",
        "message": "Activated successfully"
      },
      {
        "integration": "webhook",
        "status": "failed",
        "message": "Webhook endpoint not responding"
      }
    ]
  },
  "message": "Segment activation completed"
}
```

## Identity Resolution

### Resolve Anonymous Identity

**GET** `/identities/anonymous/{anonymousId}`

Resolve anonymous user identity to known user.

**Path Parameters:**
- `anonymousId`: Anonymous identifier

**Response:**
```json
{
  "data": {
    "anonymousId": "anon_123456",
    "resolvedUserId": "user_789",
    "confidence": 0.95,
    "matchType": "EMAIL",
    "matches": [
      {
        "userId": "user_789",
        "matchType": "EMAIL",
        "confidence": 0.95,
        "evidence": {
          "email": "john@example.com",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0..."
        }
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Identity Matches

**GET** `/identities/matches/{userId}`

Get all identity matches for a user.

**Path Parameters:**
- `userId`: User identifier

**Response:**
```json
{
  "data": [
    {
      "id": "match_123",
      "anonymousId": "anon_123456",
      "userId": "user_789",
      "matchType": "EMAIL",
      "confidence": 0.95,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "match_124",
      "anonymousId": "anon_789012",
      "userId": "user_789",
      "matchType": "WALLET",
      "confidence": 0.87,
      "createdAt": "2024-01-14T15:20:00Z"
    }
  ]
}
```

## Consent Management

### Get User Consent

**GET** `/users/{userId}/consent`

Retrieve user's consent preferences.

**Path Parameters:**
- `userId`: User identifier

**Response:**
```json
{
  "data": [
    {
      "id": "consent_123",
      "type": "MARKETING",
      "channel": "email",
      "granted": true,
      "purpose": "Promotional emails and newsletters",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-10T15:30:00Z"
    },
    {
      "id": "consent_124",
      "type": "ANALYTICS",
      "channel": "web",
      "granted": true,
      "purpose": "Website analytics and improvement",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Update Consent

**POST** `/users/{userId}/consent`

Update user consent preferences.

**Path Parameters:**
- `userId`: User identifier

**Request Body:**
```json
{
  "type": "MARKETING",
  "channel": "email",
  "granted": false,
  "purpose": "Promotional emails and newsletters",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "data": {
    "id": "consent_125",
    "userId": "user_789",
    "type": "MARKETING",
    "channel": "email",
    "granted": false,
    "purpose": "Promotional emails and newsletters",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Consent updated successfully"
}
```

### Bulk Consent Update

**POST** `/users/{userId}/consent/bulk`

Update multiple consent preferences at once.

**Path Parameters:**
- `userId`: User identifier

**Request Body:**
```json
{
  "consents": [
    {
      "type": "MARKETING",
      "channel": "email",
      "granted": true
    },
    {
      "type": "MARKETING",
      "channel": "push",
      "granted": false
    },
    {
      "type": "ANALYTICS",
      "channel": "web",
      "granted": true
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "updated": 3,
    "consents": [
      { "id": "consent_126", "type": "MARKETING", "channel": "email", "granted": true },
      { "id": "consent_127", "type": "MARKETING", "channel": "push", "granted": false },
      { "id": "consent_128", "type": "ANALYTICS", "channel": "web", "granted": true }
    ]
  },
  "message": "Bulk consent updated successfully"
}
```

## Real-time Updates

### WebSocket Connection

Connect to real-time updates via WebSocket:

```javascript
const ws = new WebSocket('wss://api.stellara.ai/cdp/realtime');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));

// Subscribe to user updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'user',
  userId: 'user_789'
}));

// Subscribe to segment updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'segment',
  segmentId: 'segment_123'
}));
```

### Real-time Events

#### User Profile Update
```json
{
  "type": "user.profile.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "userId": "user_789",
    "changes": {
      "profileData.firstName": "John",
      "profileData.lastName": "Smith"
    }
  }
}
```

#### Segment Membership Change
```json
{
  "type": "segment.membership.changed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "userId": "user_789",
    "segmentId": "segment_123",
    "action": "added",
    "segment": {
      "id": "segment_123",
      "name": "High Value Customers"
    }
  }
}
```

#### Event Processed
```json
{
  "type": "event.processed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "eventId": "event_123",
    "userId": "user_789",
    "eventName": "purchase_completed",
    "impact": {
      "segmentsUpdated": ["segment_123", "segment_124"],
      "profileUpdated": true
    }
  }
}
```

## Integrations

### Activate Integration

**POST** `/integrations/{integration}/activate`

Activate an integration for a segment.

**Path Parameters:**
- `integration`: Integration name (sendgrid, onesignal, webhook)

**Request Body:**
```json
{
  "segmentId": "segment_123",
  "config": {
    "apiKey": "your-api-key",
    "listId": "list_123",
    "templateId": "template_123"
  }
}
```

**Response:**
```json
{
  "data": {
    "integration": "sendgrid",
    "segmentId": "segment_123",
    "status": "activated",
    "config": { ... }
  },
  "message": "Integration activated successfully"
}
```

### Test Integration

**POST** `/integrations/{integration}/test`

Test integration connectivity and configuration.

**Path Parameters:**
- `integration`: Integration name

**Request Body:**
```json
{
  "testType": "connection",
  "config": {
    "apiKey": "your-api-key"
  }
}
```

**Response:**
```json
{
  "data": {
    "integration": "sendgrid",
    "testType": "connection",
    "status": "success",
    "responseTime": 250,
    "details": {
      "apiVersion": "v3",
      "quota": {
        "limit": 1000,
        "remaining": 950
      }
    }
  },
  "message": "Integration test successful"
}
```

## Analytics

### Get Event Analytics

**GET** `/analytics/events`

Retrieve event analytics and metrics.

**Query Parameters:**
- `startDate` (optional): Start date for analytics
- `endDate` (optional): End date for analytics
- `eventType` (optional): Filter by event type
- `groupBy` (optional): Group by field (day, hour, type)

**Response:**
```json
{
  "data": {
    "summary": {
      "totalEvents": 10000,
      "uniqueUsers": 2500,
      "topEventTypes": [
        { "type": "PAGE_VIEW", "count": 5000 },
        { "type": "CLICK", "count": 3000 },
        { "type": "PURCHASE", "count": 200 }
      ]
    },
    "timeline": [
      {
        "date": "2024-01-15",
        "events": 1500,
        "uniqueUsers": 350
      }
    ],
    "conversion": {
      "pageViewToPurchase": 0.04,
      "clickToPurchase": 0.067
    }
  }
}
```

### Get Segment Analytics

**GET** `/analytics/segments`

Retrieve segment performance analytics.

**Query Parameters:**
- `segmentId` (optional): Filter by segment ID
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Response:**
```json
{
  "data": [
    {
      "segmentId": "segment_123",
      "segmentName": "High Value Customers",
      "currentSize": 250,
      "growthRate": 0.15,
      "engagement": {
        "avgEventsPerUser": 45.2,
        "avgSessionDuration": 1250,
        "conversionRate": 0.08
      },
      "performance": {
        "revenuePerUser": 1250.50,
        "lifetimeValue": 5420.75,
        "retentionRate": 0.87
      }
    }
  ]
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

- **Event ingestion**: 1000 requests per minute
- **Profile operations**: 100 requests per minute
- **Segment operations**: 50 requests per minute
- **Analytics**: 25 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642248600
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { CDPClient } from '@stellara/cdp-sdk';

const cdp = new CDPClient({
  baseURL: 'https://api.stellara.ai/cdp',
  apiKey: 'your-api-key'
});

// Ingest event
await cdp.events.ingest({
  userId: 'user_789',
  type: 'PAGE_VIEW',
  source: 'WEB',
  eventName: 'homepage_visit',
  properties: { page: '/home' }
});

// Get user profile
const profile = await cdp.users.getProfile('user_789');

// Create segment
const segment = await cdp.segments.create({
  name: 'Recent Purchasers',
  type: 'SQL',
  sqlQuery: 'SELECT user_id FROM events WHERE type = "PURCHASE" AND timestamp >= NOW() - INTERVAL "30 days"'
});
```

### Python
```python
from stellara_cdp import CDPClient

cdp = CDPClient(
    base_url='https://api.stellara.ai/cdp',
    api_key='your-api-key'
)

# Ingest event
cdp.events.ingest({
    'user_id': 'user_789',
    'type': 'PAGE_VIEW',
    'source': 'WEB',
    'event_name': 'homepage_visit',
    'properties': {'page': '/home'}
})

# Update consent
cdp.users.update_consent('user_789', {
    'type': 'MARKETING',
    'channel': 'email',
    'granted': True
})

# Evaluate segment
result = cdp.segments.evaluate('segment_123')
print(f"Users added: {result.updates.added}")
```

## Webhooks

### Configure Webhook

**POST** `/webhooks`

Configure webhook endpoints for real-time notifications.

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhooks/cdp",
  "events": [
    "user.profile.updated",
    "segment.membership.changed",
    "event.processed"
  ],
  "secret": "webhook_secret_123",
  "active": true
}
```

### Webhook Events

#### User Profile Updated
```json
{
  "event": "user.profile.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "userId": "user_789",
    "changes": { ... }
  }
}
```

#### Segment Membership Changed
```json
{
  "event": "segment.membership.changed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "userId": "user_789",
    "segmentId": "segment_123",
    "action": "added"
  }
}
```

## Support

For API support and questions:
- **Documentation**: https://docs.stellara.ai/cdp
- **Support Email**: cdp-support@stellara.ai
- **Status Page**: https://status.stellara.ai
- **Developer Discord**: https://discord.gg/stellara
