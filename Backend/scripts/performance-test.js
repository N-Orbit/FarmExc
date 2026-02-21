const axios = require('axios');

// Configuration
const REST_BASE_URL = 'http://localhost:3000';
const GRAPHQL_URL = 'http://localhost:3000/graphql';
const TEST_ITERATIONS = 100;

// Test data
const testQueries = {
  // REST equivalent endpoints
  rest: {
    getCurrentUser: '/auth/me',
    getWorkflows: '/admin/workflows?page=1&limit=20',
    getWorkflow: (id) => `/admin/workflows/${id}`,
  },
  // GraphQL queries
  graphql: {
    getCurrentUser: `
      query {
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
    `,
    getWorkflows: `
      query GetWorkflows {
        workflows(page: 1, limit: 20) {
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
    `,
    getWorkflow: (id) => `
      query GetWorkflow {
        workflow(id: "${id}") {
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
    `,
  },
};

// Performance measurement utilities
function measureTime(fn) {
  const start = process.hrtime.bigint();
  return fn().then(result => {
    const end = process.hrtime.bigint();
    const time = Number(end - start) / 1000000; // Convert to milliseconds
    return { result, time };
  });
}

async function benchmarkRest(endpoint, authToken) {
  const config = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const { result, time } = await measureTime(async () => {
      const response = await axios.get(`${REST_BASE_URL}${endpoint}`, config);
      return response.data;
    });
    return { time, success: true, data: result };
  } catch (error) {
    return { time: 0, success: false, error: error.message };
  }
}

async function benchmarkGraphQL(query, authToken) {
  const config = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const { result, time } = await measureTime(async () => {
      const response = await axios.post(
        GRAPHQL_URL,
        { query },
        config
      );
      return response.data;
    });
    return { time, success: true, data: result };
  } catch (error) {
    return { time: 0, success: false, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting GraphQL vs REST Performance Tests\n');
  
  // Note: In a real scenario, you'd need to authenticate first
  const authToken = 'your-test-auth-token-here';
  
  const results = {
    getCurrentUser: { rest: [], graphql: [] },
    getWorkflows: { rest: [], graphql: [] },
    getWorkflow: { rest: [], graphql: [] },
  };

  // Test getCurrentUser
  console.log('📊 Testing getCurrentUser endpoint...');
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const restResult = await benchmarkRest(testQueries.rest.getCurrentUser, authToken);
    const graphqlResult = await benchmarkGraphQL(testQueries.graphql.getCurrentUser, authToken);
    
    if (restResult.success) results.getCurrentUser.rest.push(restResult.time);
    if (graphqlResult.success) results.getCurrentUser.graphql.push(graphqlResult.time);
  }

  // Test getWorkflows
  console.log('📊 Testing getWorkflows endpoint...');
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const restResult = await benchmarkRest(testQueries.rest.getWorkflows, authToken);
    const graphqlResult = await benchmarkGraphQL(testQueries.graphql.getWorkflows, authToken);
    
    if (restResult.success) results.getWorkflows.rest.push(restResult.time);
    if (graphqlResult.success) results.getWorkflows.graphql.push(graphqlResult.time);
  }

  // Test getWorkflow (using a sample ID)
  console.log('📊 Testing getWorkflow endpoint...');
  const sampleWorkflowId = 'sample-workflow-id';
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const restResult = await benchmarkRest(
      testQueries.rest.getWorkflow(sampleWorkflowId), 
      authToken
    );
    const graphqlResult = await benchmarkGraphQL(
      testQueries.graphql.getWorkflow(sampleWorkflowId), 
      authToken
    );
    
    if (restResult.success) results.getWorkflow.rest.push(restResult.time);
    if (graphqlResult.success) results.getWorkflow.graphql.push(graphqlResult.time);
  }

  // Calculate and display results
  console.log('\n📈 Performance Results:');
  console.log('='.repeat(50));

  Object.keys(results).forEach(testName => {
    const restTimes = results[testName].rest;
    const graphqlTimes = results[testName].graphql;
    
    if (restTimes.length > 0 && graphqlTimes.length > 0) {
      const restAvg = restTimes.reduce((a, b) => a + b, 0) / restTimes.length;
      const graphqlAvg = graphqlTimes.reduce((a, b) => a + b, 0) / graphqlTimes.length;
      const improvement = ((restAvg - graphqlAvg) / restAvg * 100).toFixed(2);
      
      console.log(`\n${testName}:`);
      console.log(`  REST:     ${restAvg.toFixed(2)}ms (avg)`);
      console.log(`  GraphQL:  ${graphqlAvg.toFixed(2)}ms (avg)`);
      console.log(`  Improvement: ${improvement}% ${improvement > 0 ? '✅' : '❌'}`);
    }
  });

  // Data size comparison
  console.log('\n📦 Data Size Comparison:');
  console.log('='.repeat(30));
  
  try {
    const restResponse = await benchmarkRest(testQueries.rest.getWorkflows, authToken);
    const graphqlResponse = await benchmarkGraphQL(testQueries.graphql.getWorkflows, authToken);
    
    if (restResponse.success && graphqlResponse.success) {
      const restSize = JSON.stringify(restResponse.data).length;
      const graphqlSize = JSON.stringify(graphqlResponse.data).length;
      const sizeReduction = ((restSize - graphqlSize) / restSize * 100).toFixed(2);
      
      console.log(`REST payload:     ${restSize} bytes`);
      console.log(`GraphQL payload:  ${graphqlSize} bytes`);
      console.log(`Size reduction:   ${sizeReduction}% ${sizeReduction > 0 ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('Could not compare payload sizes:', error.message);
  }

  console.log('\n✅ Performance testing completed!');
}

// Memory usage monitoring
function monitorMemoryUsage() {
  const usage = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024 * 100) / 100} MB`);
  console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100} MB`);
  console.log(`  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100} MB`);
  console.log(`  External: ${Math.round(usage.external / 1024 / 1024 * 100) / 100} MB`);
}

// Run tests if this script is executed directly
if (require.main === module) {
  monitorMemoryUsage();
  runPerformanceTests().catch(console.error);
}

module.exports = {
  benchmarkRest,
  benchmarkGraphQL,
  runPerformanceTests,
  monitorMemoryUsage,
};
