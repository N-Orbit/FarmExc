import { Test, TestingModule } from '@nestjs/testing';
import { NlpController } from './nlp.controller';
import { NlpService } from './nlp.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';

describe('NlpController', () => {
  let controller: NlpController;
  let service: NlpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NlpController],
      providers: [
        {
          provide: NlpService,
          useValue: {
            processQuery: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NlpController>(NlpController);
    service = module.get<NlpService>(NlpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process a query successfully', async () => {
    const req: QueryRequestDto = { question: 'test' };
    const res: QueryResponseDto = {
      type: 'table',
      data: [{ id: 1 }],
      confidence: 0.9,
    };
    
    jest.spyOn(service, 'processQuery').mockResolvedValue(res);

    expect(await controller.query(req)).toEqual(res);
    expect(service.processQuery).toHaveBeenCalledWith(req);
  });
});
