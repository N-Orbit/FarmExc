import { Injectable } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import { GraphQLPubSubService } from '../services/graphql-pubsub.service';
import { Workflow } from '../../workflow/entities/workflow.entity';

@Injectable()
@WebSocketGateway()
export class WorkflowEventsHook implements OnGatewayInit {
  constructor(private readonly pubSubService: GraphQLPubSubService) {}

  afterInit(server: any) {
    console.log('WebSocket Gateway initialized for GraphQL subscriptions');
  }

  async publishWorkflowCreated(workflow: Workflow) {
    await this.pubSubService.publish('workflowCreated', {
      workflowCreated: workflow,
    });
  }

  async publishWorkflowUpdated(workflow: Workflow) {
    await this.pubSubService.publish('workflowUpdated', {
      workflowUpdated: workflow,
    });
  }

  async publishWorkflowCompleted(workflow: Workflow) {
    await this.pubSubService.publish('workflowCompleted', {
      workflowCompleted: workflow,
    });
  }

  async publishWorkflowFailed(workflow: Workflow) {
    await this.pubSubService.publish('workflowFailed', {
      workflowFailed: workflow,
    });
  }
}
