import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  username?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [WalletType], { nullable: true })
  wallets?: WalletType[];
}

@ObjectType('Wallet')
export class WalletType {
  @Field(() => ID)
  id: string;

  @Field()
  publicKey: string;

  @Field()
  isPrimary: boolean;

  @Field({ nullable: true })
  lastUsed?: Date;

  @Field()
  createdAt: Date;
}
