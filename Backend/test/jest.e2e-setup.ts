import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

let prisma: PrismaClient;

beforeAll(async () => {
  // Initialize Prisma Client for tests
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Connect to database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up database connections
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanDatabase();
});

async function cleanDatabase() {
  // Clean up in correct order due to foreign key constraints
  const tablenames = [
    'regulatory_audit_trails',
    'regulatory_transactions',
    'regulatory_reports',
    'compliance_configurations',
    'examiner_access',
    'cdp_segment_memberships',
    'cdp_identity_matches',
    'cdp_consents',
    'cdp_segments',
    'cdp_events',
    'audit_logs',
    'verification_sessions',
    'notifications',
    'notification_settings',
    'contributions',
    'projects',
    'users',
  ];

  for (const tablename of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${tablename}";`);
    } catch (error) {
      // Table might not exist, continue
    }
  }
}
