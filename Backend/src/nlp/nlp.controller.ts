import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NlpService } from './nlp.service';
import { QueryRequestDto } from './dto/query-request.dto';
import { QueryResponseDto } from './dto/query-response.dto';

@Controller('nlp')
export class NlpController {
  constructor(private readonly nlpService: NlpService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(@Body() body: QueryRequestDto): Promise<QueryResponseDto> {
    return this.nlpService.processQuery(body);
  }
}
