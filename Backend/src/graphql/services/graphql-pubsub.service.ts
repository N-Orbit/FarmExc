import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class GraphQLPubSubService {
  private pubSub: PubSub;

  constructor() {
    this.pubSub = new PubSub();
  }

  getPubSub(): PubSub {
    return this.pubSub;
  }

  async publish(triggerName: string, payload: any): Promise<void> {
    await this.pubSub.publish(triggerName, payload);
  }

  asyncIterator<T>(triggerName: string | string[]): AsyncIterableIterator<T> {
    return this.pubSub.asyncIterator<T>(triggerName);
  }
}
