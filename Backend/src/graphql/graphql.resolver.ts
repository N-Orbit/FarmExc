import { Resolver, Query, Args, Int, ResolveField, Parent, Subscription } from '@nestjs/graphql';
import { GraphqlService } from './graphql.service';
import { UserType, CallType, PaginatedUsersType, ProjectType, ContributionType, MilestoneType } from './graphql.types';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly graphqlService: GraphqlService) {}

  @Query(() => UserType, { nullable: true, description: 'Fetch a single user by ID' })
  async user(@Args('id', { type: () => String }) id: string): Promise<UserType | null> {
    return this.graphqlService.getUserById(id);
  }

  @Query(() => PaginatedUsersType, { description: 'Fetch paginated list of users' })
  async users(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedUsersType> {
    return this.graphqlService.getUsers(limit, offset);
  }

  @ResolveField(() => [ProjectType])
  async projects(@Parent() user: UserType) {
    return this.graphqlService.getProjects(100, 0); // Simplified, should filter by userId
  }

  @ResolveField(() => [ContributionType])
  async contributions(@Parent() user: UserType) {
    return this.graphqlService.getContributionsByUserId(user.id);
  }
}

@Resolver(() => ProjectType)
export class ProjectResolver {
  constructor(private readonly graphqlService: GraphqlService) {}

  @Query(() => [ProjectType])
  async projects(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ) {
    return this.graphqlService.getProjects(limit, offset);
  }

  @ResolveField(() => UserType)
  async creator(@Parent() project: any) {
    return this.graphqlService.getUserById(project.creatorId);
  }

  @ResolveField(() => [ContributionType])
  async contributions(@Parent() project: ProjectType) {
    return this.graphqlService.getContributionsByProjectId(project.id);
  }

  @ResolveField(() => [MilestoneType])
  async milestones(@Parent() project: ProjectType) {
    return this.graphqlService.getMilestonesByProjectId(project.id);
  }

  @Subscription(() => ProjectType, {
    name: 'projectCreated',
  })
  projectCreated() {
    return pubSub.asyncIterator('projectCreated');
  }
}

@Resolver()
export class GraphqlResolver {
  constructor(private readonly graphqlService: GraphqlService) {}

  @Query(() => [CallType], { description: 'Fetch a list of calls' })
  async calls(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<CallType[]> {
    return this.graphqlService.getCalls(limit);
  }
}

