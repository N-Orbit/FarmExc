import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class QueryRequestDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsOptional()
  contextId?: string;
}
