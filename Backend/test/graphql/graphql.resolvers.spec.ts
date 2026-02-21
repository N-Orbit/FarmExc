import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AuthResolver } from '../../src/graphql/resolvers/auth.resolver';
import { WorkflowResolver } from '../../src/graphql/resolvers/workflow.resolver';
import { UserResolver } from '../../src/graphql/resolvers/user.resolver';
import { SubscriptionResolver } from '../../src/graphql/resolvers/subscription.resolver';
import { GraphQLPubSubService } from '../../src/graphql/services/graphql-pubsub.service';
import { NonceService } from '../../src/auth/services/nonce.service';
import { WalletService } from '../../src/auth/services/wallet.service';
import { JwtAuthService } from '../../src/auth/services/jwt-auth.service';
import { WorkflowExecutionService } from '../../src/workflow/services/workflow-execution.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workflow } from '../../src/workflow/entities/workflow.entity';
import { WorkflowStep } from '../../src/workflow/entities/workflow-step.entity';

describe('GraphQL Resolvers', () => {
  let module: TestingModule;
  let authResolver: AuthResolver;
  let workflowResolver: WorkflowResolver;
  let userResolver: UserResolver;
  let subscriptionResolver: SubscriptionResolver;

  beforeEach(async () => {
    const mockNonceService = {
      generateNonce: jest.fn(),
      validateNonce: jest.fn(),
      markNonceUsed: jest.fn(),
    };

    const mockWalletService = {
      verifySignature: jest.fn(),
      findUserByWallet: jest.fn(),
      createUserWithWallet: jest.fn(),
      updateLastUsed: jest.fn(),
    };

    const mockJwtAuthService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
    };

    const mockWorkflowExecutionService = {
      retryWorkflow: jest.fn(),
      cancelWorkflow: jest.fn(),
    };

    const mockWorkflowRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockStepRepository = {
      findOne: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        AuthResolver,
        WorkflowResolver,
        UserResolver,
        SubscriptionResolver,
        GraphQLPubSubService,
        {
          provide: NonceService,
          useValue: mockNonceService,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: JwtAuthService,
          useValue: mockJwtAuthService,
        },
        {
          provide: WorkflowExecutionService,
          useValue: mockWorkflowExecutionService,
        },
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepository,
        },
        {
          provide: getRepositoryToken(WorkflowStep),
          useValue: mockStepRepository,
        },
      ],
    }).compile();

    authResolver = module.get<AuthResolver>(AuthResolver);
    workflowResolver = module.get<WorkflowResolver>(WorkflowResolver);
    userResolver = module.get<UserResolver>(UserResolver);
    subscriptionResolver = module.get<SubscriptionResolver>(SubscriptionResolver);
  });

  it('should be defined', () => {
    expect(authResolver).toBeDefined();
    expect(workflowResolver).toBeDefined();
    expect(userResolver).toBeDefined();
    expect(subscriptionResolver).toBeDefined();
  });

  describe('AuthResolver', () => {
    it('should request nonce', async () => {
      const publicKey = 'test-public-key';
      const expectedNonce = 'test-nonce';
      
      jest.spyOn(authResolver['nonceService'], 'generateNonce')
        .mockResolvedValue({ nonce: expectedNonce });

      const result = await authResolver.requestNonce(publicKey);
      expect(result).toBe(expectedNonce);
    });
  });

  describe('WorkflowResolver', () => {
    it('should get workflows', async () => {
      const mockWorkflows = [
        { id: '1', type: 'CONTRACT_DEPLOYMENT', state: 'COMPLETED' },
      ];
      
      jest.spyOn(workflowResolver['workflowRepository'], 'findAndCount')
        .mockResolvedValue([mockWorkflows, 1]);

      const result = await workflowResolver.getWorkflows();
      expect(result).toEqual(mockWorkflows);
    });

    it('should get single workflow', async () => {
      const mockWorkflow = { id: '1', type: 'CONTRACT_DEPLOYMENT', state: 'COMPLETED' };
      
      jest.spyOn(workflowResolver['workflowRepository'], 'findOne')
        .mockResolvedValue(mockWorkflow);

      const result = await workflowResolver.getWorkflow('1');
      expect(result).toEqual(mockWorkflow);
    });
  });
});
