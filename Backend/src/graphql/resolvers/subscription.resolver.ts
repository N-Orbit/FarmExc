import { Resolver, Subscription, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WorkflowGraphType } from '../types/workflow.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => WorkflowGraphType)
export class SubscriptionResolver {
  constructor() {}

  @Subscription(() => WorkflowGraphType, {
    name: 'workflowUpdated',
    filter: (payload, variables) => {
      return payload.workflowUpdated.userId === variables.userId;
    },
  })
  @UseGuards(JwtAuthGuard)
  workflowUpdated(@Context() context) {
    return pubSub.asyncIterator(['workflowUpdated']);
  }

  @Subscription(() => WorkflowGraphType, {
    name: 'workflowCreated',
    filter: (payload, variables) => {
      return payload.workflowCreated.userId === variables.userId;
    },
  })
  @UseGuards(JwtAuthGuard)
  workflowCreated(@Context() context) {
    return pubSub.asyncIterator(['workflowCreated']);
  }

  @Subscription(() => WorkflowGraphType, {
    name: 'workflowCompleted',
    filter: (payload, variables) => {
      return payload.workflowCompleted.userId === variables.userId;
    },
  })
  @UseGuards(JwtAuthGuard)
  workflowCompleted(@Context() context) {
    return pubSub.asyncIterator(['workflowCompleted']);
  }

  @Subscription(() => WorkflowGraphType, {
    name: 'workflowFailed',
    filter: (payload, variables) => {
      return payload.workflowFailed.userId === variables.userId;
    },
  })
  @UseGuards(JwtAuthGuard)
  workflowFailed(@Context() context) {
    return pubSub.asyncIterator(['workflowFailed']);
  }
}

export const pubSubInstance = pubSub;
