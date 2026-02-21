import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserType } from '../types/user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserService } from '../../auth/services/user.service';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserType, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Context() context) {
    return context.req.user;
  }

  @Query(() => UserType, { name: 'user', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getUser(@Args('id') id: string) {
    return this.userService.findById(id);
  }
}
