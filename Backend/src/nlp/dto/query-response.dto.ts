export class QueryResponseDto {
  type: 'table' | 'chart' | 'text' | 'clarification';
  data: any;
  sql?: string;
  confidence: number;
  clarificationRequest?: string;
}
