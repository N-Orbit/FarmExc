import { Test, TestingModule } from '@nestjs/testing';
import { NlpService } from './nlp.service';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('NlpService', () => {
  let service: NlpService;
  let llmService: LlmService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NlpService,
        {
          provide: LlmService,
          useValue: {
            parseQueryToSql: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRawUnsafe: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NlpService>(NlpService);
    llmService = module.get<LlmService>(LlmService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return clarification if confidence is low', async () => {
    jest.spyOn(llmService, 'parseQueryToSql').mockResolvedValue({
      confidence: 0.5,
      type: 'clarification',
      clarificationRequest: 'Please specify',
    });

    const res = await service.processQuery({ question: 'unsure' });
    expect(res.type).toBe('clarification');
    expect(res.clarificationRequest).toBe('Please specify');
  });

  it('should throw an error for mutating SQL', async () => {
    jest.spyOn(llmService, 'parseQueryToSql').mockResolvedValue({
      confidence: 0.9,
      type: 'table',
      sql: 'DELETE FROM users',
    });

    await expect(service.processQuery({ question: 'delete all users' })).rejects.toThrow(BadRequestException);
  });

  it('should execute valid SELECT sql with added limit', async () => {
    jest.spyOn(llmService, 'parseQueryToSql').mockResolvedValue({
      confidence: 0.9,
      type: 'table',
      sql: 'SELECT * FROM users',
    });
    
    // @ts-ignore
    jest.spyOn(prismaService, '$queryRawUnsafe').mockResolvedValue([{ id: '1' }]);

    const res = await service.processQuery({ question: 'get users' });
    
    expect(res.data).toEqual([{ id: '1' }]);
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith('SELECT * FROM users LIMIT 100');
  });
});
