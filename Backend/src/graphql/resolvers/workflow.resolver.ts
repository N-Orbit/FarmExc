import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { 
  WorkflowGraphType, 
  WorkflowStepGraphType, 
  WorkflowFilterInput,
  WorkflowSortInput
} from '../types/workflow.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../../workflow/entities/workflow.entity';
import { WorkflowStep } from '../../workflow/entities/workflow-step.entity';
import { WorkflowExecutionService } from '../../workflow/services/workflow-execution.service';

@Resolver(() => WorkflowGraphType)
export class WorkflowResolver {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepository: Repository<WorkflowStep>,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Query(() => [WorkflowGraphType], { name: 'workflows' })
  @UseGuards(JwtAuthGuard)
  async getWorkflows(
    @Args('filter', { nullable: true }) filter?: WorkflowFilterInput,
    @Args('sort', { nullable: true }) sort?: WorkflowSortInput,
    @Args('page', { defaultValue: 1 }) page: number,
    @Args('limit', { defaultValue: 20 }) limit: number,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filter?.state) where.state = filter.state;
    if (filter?.type) where.type = filter.type;
    if (filter?.userId) where.userId = filter.userId;
    if (filter?.walletAddress) where.walletAddress = filter.walletAddress;

    const order: any = {};
    if (sort?.field) {
      order[sort.field] = sort.direction || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    const [workflows, total] = await this.workflowRepository.findAndCount({
      where,
      relations: ['steps'],
      order,
      skip,
      take: limit,
    });

    return workflows;
  }

  @Query(() => WorkflowGraphType, { name: 'workflow', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getWorkflow(@Args('id') id: string) {
    return this.workflowRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
  }

  @Query(() => WorkflowStepGraphType, { name: 'workflowStep', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getWorkflowStep(
    @Args('workflowId') workflowId: string,
    @Args('stepId') stepId: string,
  ) {
    return this.stepRepository.findOne({
      where: { id: stepId, workflowId },
    });
  }

  @Mutation(() => WorkflowGraphType)
  @UseGuards(JwtAuthGuard)
  async retryWorkflow(@Args('id') id: string) {
    await this.workflowExecutionService.retryWorkflow(id);
    return this.workflowRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
  }

  @Mutation(() => WorkflowGraphType)
  @UseGuards(JwtAuthGuard)
  async cancelWorkflow(@Args('id') id: string) {
    await this.workflowExecutionService.cancelWorkflow(id);
    return this.workflowRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
  }

  @Query(() => [WorkflowGraphType], { name: 'searchWorkflows' })
  @UseGuards(JwtAuthGuard)
  async searchWorkflows(
    @Args('query') query: string,
    @Args('page', { defaultValue: 1 }) page: number,
    @Args('limit', { defaultValue: 20 }) limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [workflows] = await this.workflowRepository.find({
      where: [
        { idempotencyKey: `%${query}%` },
        { walletAddress: `%${query}%` },
      ],
      relations: ['steps'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return workflows;
  }
}
