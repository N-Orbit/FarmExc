import { Field, ObjectType, ID, Enum, InputType } from '@nestjs/graphql';
import { WorkflowState } from '../../../workflow/types/workflow-state.enum';
import { WorkflowType as WorkflowTypeEnum } from '../../../workflow/types/workflow-type.enum';
import { StepState } from '../../../workflow/types/step-state.enum';

@ObjectType('Workflow')
export class WorkflowGraphType {
  @Field(() => ID)
  id: string;

  @Field()
  idempotencyKey: string;

  @Field(() => WorkflowTypeGraphEnum)
  type: WorkflowTypeEnum;

  @Field(() => WorkflowStateGraphEnum)
  state: WorkflowState;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  walletAddress?: string;

  @Field()
  input: Record<string, any>;

  @Field({ nullable: true })
  output?: Record<string, any>;

  @Field({ nullable: true })
  context?: Record<string, any>;

  @Field()
  currentStepIndex: number;

  @Field()
  totalSteps: number;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  failedAt?: Date;

  @Field({ nullable: true })
  failureReason?: string;

  @Field()
  retryCount: number;

  @Field()
  maxRetries: number;

  @Field({ nullable: true })
  nextRetryAt?: Date;

  @Field()
  requiresCompensation: boolean;

  @Field()
  isCompensated: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [WorkflowStepGraphType], { nullable: true })
  steps?: WorkflowStepGraphType[];
}

@ObjectType('WorkflowStep')
export class WorkflowStepGraphType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  workflowId: string;

  @Field()
  stepName: string;

  @Field()
  stepIndex: number;

  @Field(() => StepStateGraphEnum)
  state: StepState;

  @Field({ nullable: true })
  input?: Record<string, any>;

  @Field({ nullable: true })
  output?: Record<string, any>;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  failedAt?: Date;

  @Field({ nullable: true })
  failureReason?: string;

  @Field()
  retryCount: number;

  @Field()
  maxRetries: number;

  @Field({ nullable: true })
  compensatedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@Enum('WorkflowState')
export class WorkflowStateGraphEnum {
  static PENDING = 'pending';
  static RUNNING = 'running';
  static COMPLETED = 'completed';
  static FAILED = 'failed';
  static CANCELLED = 'cancelled';
  static COMPENSATING = 'compensating';
  static COMPENSATED = 'compensated';
}

@Enum('WorkflowType')
export class WorkflowTypeGraphEnum {
  static CONTRACT_DEPLOYMENT = 'contract_deployment';
  static TRADE_EXECUTION = 'trade_execution';
  static AI_JOB_CHAIN = 'ai_job_chain';
  static INDEXING_VERIFICATION = 'indexing_verification';
  static PORTFOLIO_UPDATE = 'portfolio_update';
  static REWARD_GRANT = 'reward_grant';
}

@Enum('StepState')
export class StepStateGraphEnum {
  static PENDING = 'pending';
  static RUNNING = 'running';
  static COMPLETED = 'completed';
  static FAILED = 'failed';
  static SKIPPED = 'skipped';
  static COMPENSATING = 'compensating';
  static COMPENSATED = 'compensated';
}

@InputType('WorkflowFilter')
export class WorkflowFilterInput {
  @Field({ nullable: true })
  state?: WorkflowState;

  @Field({ nullable: true })
  type?: WorkflowTypeEnum;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  walletAddress?: string;
}

@InputType('WorkflowSort')
export class WorkflowSortInput {
  @Field({ nullable: true })
  field?: 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt';

  @Field({ nullable: true })
  direction?: 'ASC' | 'DESC';
}
