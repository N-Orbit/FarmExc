import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AuthResolver } from './resolvers/auth.resolver';
import { WorkflowResolver } from './resolvers/workflow.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { SubscriptionResolver } from './resolvers/subscription.resolver';
import { GraphQLPubSubService } from './services/graphql-pubsub.service';

@Module({
  imports: [
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
        sortSchema: true,
        playground: configService.get('NODE_ENV') !== 'production',
        introspection: configService.get('NODE_ENV') !== 'production',
        context: ({ req, connection }) => {
          return {
            req: req || connection?.context?.req,
          };
        },
        subscriptions: {
          'graphql-ws': true,
          'subscriptions-transport-ws': true,
        },
        cors: {
          origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
          credentials: true,
        },
        plugins: [
          {
            requestDidStart() {
              return {
                didResolveOperation(requestContext) {
                  console.log(
                    `GraphQL Operation: ${requestContext.request.operationName}`,
                  );
                },
              };
            },
          },
        ],
      }),
    }),
  ],
  providers: [
    AuthResolver,
    WorkflowResolver,
    UserResolver,
    SubscriptionResolver,
    GraphQLPubSubService,
  ],
  exports: [GraphQLPubSubService],
})
export class GraphQLModule {}
