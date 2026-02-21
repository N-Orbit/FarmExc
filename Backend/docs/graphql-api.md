# GraphQL API Documentation

## Overview

This document describes the GraphQL API implementation for the Stellara Contracts backend. The GraphQL API provides flexible data fetching capabilities and reduces over-fetching/under-fetching issues compared to traditional REST endpoints.

## Getting Started

### GraphQL Endpoint

- **Production**: `https://api.stellara.network/graphql`
- **Development**: `http://localhost:3000/graphql`

### GraphQL Playground

The GraphQL Playground is available in development mode at:
- **Development**: `http://localhost:3000/graphql`

## Authentication

The GraphQL API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Schema Overview

### Core Types

#### User
```graphql
type User {
  id: ID!
  email: String
  username: String
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  wallets: [Wallet]
}

type Wallet {
  id: ID!
  publicKey: String!
  isPrimary: Boolean!
  lastUsed: DateTime
  createdAt: DateTime!
}
```

#### Workflow
```graphql
type Workflow {
  id: ID!
  idempotencyKey: String!
  type: WorkflowType!
  state: WorkflowState!
  userId: String
  walletAddress: String
  input: JSON!
  output: JSON
  context: JSON
  currentStepIndex: Int!
  totalSteps: Int!
  startedAt: DateTime
  completedAt: DateTime
  failedAt: DateTime
  failureReason: String
  retryCount: Int!
  maxRetries: Int!
  nextRetryAt: DateTime
  requiresCompensation: Boolean!
  isCompensated: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  steps: [WorkflowStep]
}

type WorkflowStep {
  id: ID!
  workflowId: ID!
  stepName: String!
  stepIndex: Int!
  state: StepState!
  input: JSON
  output: JSON
  startedAt: DateTime
  completedAt: DateTime
  failedAt: DateTime
  failureReason: String
  retryCount: Int!
  maxRetries: Int!
  compensatedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Enums
```graphql
enum WorkflowState {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
  COMPENSATING
  COMPENSATED
}

enum WorkflowType {
  CONTRACT_DEPLOYMENT
  TRADE_EXECUTION
  AI_JOB_CHAIN
  INDEXING_VERIFICATION
  PORTFOLIO_UPDATE
  REWARD_GRANT
}

enum StepState {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  SKIPPED
  COMPENSATING
  COMPENSATED
}
```

## Queries

### Get Current User
```graphql
query Me {
  me {
    id
    email
    username
    isActive
    createdAt
    wallets {
      id
      publicKey
      isPrimary
      lastUsed
    }
  }
}
```

### Get Workflows
```graphql
query GetWorkflows(
  $filter: WorkflowFilter
  $sort: WorkflowSort
  $page: Int = 1
  $limit: Int = 20
) {
  workflows(filter: $filter, sort: $sort, page: $page, limit: $limit) {
    id
    idempotencyKey
    type
    state
    userId
    walletAddress
    createdAt
    steps {
      id
      stepName
      state
      startedAt
      completedAt
    }
  }
}
```

### Get Single Workflow
```graphql
query GetWorkflow($id: ID!) {
  workflow(id: $id) {
    id
    idempotencyKey
    type
    state
    input
    output
    createdAt
    steps {
      id
      stepName
      stepIndex
      state
      input
      output
      startedAt
      completedAt
      failureReason
    }
  }
}
```

### Search Workflows
```graphql
query SearchWorkflows($query: String!, $page: Int = 1, $limit: Int = 20) {
  searchWorkflows(query: $query, page: $page, limit: $limit) {
    id
    idempotencyKey
    state
    walletAddress
    createdAt
  }
}
```

## Mutations

### Request Nonce
```graphql
mutation RequestNonce($publicKey: String!) {
  requestNonce(publicKey: $publicKey)
}
```

### Wallet Login
```graphql
mutation WalletLogin($input: WalletLoginInput!) {
  walletLogin(input: $input) {
    accessToken
    refreshTokenId
    refreshToken
    user {
      id
      email
      username
      createdAt
    }
  }
}
```

### Refresh Token
```graphql
mutation RefreshToken($input: RefreshTokenInput!) {
  refreshToken(input: $input) {
    accessToken
    refreshTokenId
    refreshToken
  }
}
```

### Logout
```graphql
mutation Logout {
  logout
}
```

### Retry Workflow
```graphql
mutation RetryWorkflow($id: ID!) {
  retryWorkflow(id: $id) {
    id
    state
    retryCount
    updatedAt
  }
}
```

### Cancel Workflow
```graphql
mutation CancelWorkflow($id: ID!) {
  cancelWorkflow(id: $id) {
    id
    state
    updatedAt
  }
}
```

## Subscriptions

### Workflow Updates
```graphql
subscription WorkflowUpdated($userId: String!) {
  workflowUpdated(userId: $userId) {
    id
    state
    currentStepIndex
    updatedAt
  }
}
```

### Workflow Created
```graphql
subscription WorkflowCreated($userId: String!) {
  workflowCreated(userId: $userId) {
    id
    type
    state
    createdAt
  }
}
```

### Workflow Completed
```graphql
subscription WorkflowCompleted($userId: String!) {
  workflowCompleted(userId: $userId) {
    id
    state
    output
    completedAt
  }
}
```

### Workflow Failed
```graphql
subscription WorkflowFailed($userId: String!) {
  workflowFailed(userId: $userId) {
    id
    state
    failureReason
    failedAt
  }
}
```

## Input Types

### WorkflowFilter
```graphql
input WorkflowFilter {
  state: WorkflowState
  type: WorkflowType
  userId: String
  walletAddress: String
}
```

### WorkflowSort
```graphql
input WorkflowSort {
  field: String
  direction: String
}
```

## Performance Benefits

### Reduced Over-fetching
GraphQL allows clients to request exactly the data they need, reducing payload sizes compared to REST endpoints that return fixed data structures.

### Reduced Under-fetching
GraphQL eliminates the need for multiple API calls to related data. A single GraphQL query can fetch complex, nested data structures.

### Strong Typing
The GraphQL schema provides strong typing and validation, reducing runtime errors and improving developer experience.

### Real-time Updates
Subscriptions provide real-time updates without the need for polling or additional infrastructure.

## Usage Examples

### Fetching User with Recent Workflows
```graphql
query UserWithWorkflows {
  me {
    id
    email
    wallets {
      publicKey
      isPrimary
    }
    workflows(filter: { state: COMPLETED }, limit: 5) {
      id
      type
      createdAt
      completedAt
    }
  }
}
```

### Real-time Workflow Monitoring
```graphql
subscription MonitorWorkflow($userId: String!) {
  workflowUpdated(userId: $userId) {
    id
    state
    currentStepIndex
    totalSteps
    steps {
      stepName
      state
      completedAt
    }
  }
}
```

## Error Handling

GraphQL responses follow the standard GraphQL error format:

```json
{
  "errors": [
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": { "code": "NOT_FOUND" }
    }
  ],
  "data": null
}
```

## Rate Limiting

GraphQL endpoints are subject to the same rate limiting as REST endpoints. Complex queries may be subject to additional query complexity analysis to prevent abuse.

## Caching

GraphQL responses can be cached using standard HTTP caching mechanisms. The `Cache-Control` header is set appropriately based on the query complexity and data freshness requirements.
