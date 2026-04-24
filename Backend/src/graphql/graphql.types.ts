import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  walletAddress: string;

  @Field(() => Int)
  reputationScore: number;

  @Field(() => [ProjectType], { nullable: true })
  projects?: ProjectType[];

  @Field(() => [ContributionType], { nullable: true })
  contributions?: ContributionType[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ProjectType {
  @Field(() => ID)
  id: string;

  @Field()
  contractId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field()
  category: string;

  @Field(() => Float)
  goal: number;

  @Field(() => Float)
  currentFunds: number;

  @Field()
  deadline: Date;

  @Field(() => UserType)
  creator: UserType;

  @Field(() => [ContributionType], { nullable: true })
  contributions?: ContributionType[];

  @Field(() => [MilestoneType], { nullable: true })
  milestones?: MilestoneType[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ContributionType {
  @Field(() => ID)
  id: string;

  @Field()
  transactionHash: string;

  @Field(() => UserType)
  investor: UserType;

  @Field(() => ProjectType)
  project: ProjectType;

  @Field(() => Float)
  amount: number;

  @Field()
  timestamp: Date;
}

@ObjectType()
export class CallType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  outcome: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class StakeLedgerType {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Float, { nullable: true })
  profitLoss: number;

  @Field({ nullable: true })
  resolutionStatus: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedUsersType {
  @Field(() => [UserType])
  items: UserType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;
}

@ObjectType()
export class MilestoneType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => Float)
  fundingAmount: number;

  @Field()
  status: string;

  @Field({ nullable: true })
  completionDate: Date;

  @Field()
  createdAt: Date;
}

