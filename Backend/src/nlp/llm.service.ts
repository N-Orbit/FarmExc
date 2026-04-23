import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LlmAnalysisResult {
  sql?: string;
  confidence: number;
  clarificationRequest?: string;
  type: 'table' | 'chart' | 'text' | 'clarification';
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openai: OpenAI | null = null;
  private isMock = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'mock_key') {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('LLM service initialized with OpenAI API.');
    } else {
      this.isMock = true;
      this.logger.warn('No valid OPENAI_API_KEY found. LLM service is running in mock mode.');
    }
  }

  private getSchemaContext(): string {
    return `
We have a PostgreSQL database with the following key tables:
1. users (id, wallet_address, reputation_score, trust_score, created_at)
2. projects (id, project_id, title, category, goal, current_funds, status, created_at)
3. contributions (id, transaction_hash, investor_id, project_id, amount, created_at)
4. reputation_activities (id, subject_id, activity_type, value, occurred_at)

When generating SQL, use double quotes for table and column names if needed.
Never use any mutating commands (INSERT, UPDATE, DELETE, DROP).
Always SELECT with a LIMIT (e.g., LIMIT 100) if no limit is specified.
    `;
  }

  async parseQueryToSql(question: string, context?: string): Promise<LlmAnalysisResult> {
    if (this.isMock) {
      return this.mockLlmResponse(question);
    }

    try {
      const prompt = `
${this.getSchemaContext()}

User's Question: "${question}"
Previous Context: "${context || 'None'}"

Analyze the question and provide a JSON response summarizing what to execute. Do not provide any conversational text, only return a JSON object with this exact structure:
{
  "sql": "A safe read-only SQL query to answer the question, or null if unclear",
  "confidence": 0.0 to 1.0 representing your confidence in understanding the question,
  "type": "table", "chart", "text", or "clarification" depending on the best way to visualize it,
  "clarificationRequest": "If confidence is below 0.7, provide a clear question to ask the user, otherwise null"
}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content) as LlmAnalysisResult;
    } catch (error) {
      this.logger.error('Failed to parse query to SQL using OpenAI', error);
      throw new Error('LLM Service error');
    }
  }

  private mockLlmResponse(question: string): LlmAnalysisResult {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('top 10 traders') || lowerQ.includes('top traders')) {
      return {
        sql: 'SELECT u.wallet_address, SUM(c.amount) as total_amount FROM users u JOIN contributions c ON u.id = c.investor_id GROUP BY u.wallet_address ORDER BY total_amount DESC LIMIT 10',
        confidence: 0.9,
        type: 'chart',
      };
    }

    if (lowerQ.includes('total volume') || lowerQ.includes('contributions')) {
      return {
        sql: 'SELECT SUM(amount) as total_volume FROM contributions',
        confidence: 0.85,
        type: 'text',
      };
    }

    if (lowerQ.includes('projects') && lowerQ.includes('status')) {
       return {
         sql: 'SELECT status, COUNT(*) as count FROM projects GROUP BY status',
         confidence: 0.95,
         type: 'chart',
       };
    }

    // Fallback or clarification
    return {
      sql: null,
      confidence: 0.4,
      type: 'clarification',
      clarificationRequest: "I'm not exactly sure what you mean. Are you asking about contributions, projects, or users?",
    };
  }
}
