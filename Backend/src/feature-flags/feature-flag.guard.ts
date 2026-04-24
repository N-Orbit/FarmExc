import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from './feature-flag.service';

export const FEATURE_FLAG_KEY = 'feature_flag';
export const FeatureFlag = (name: string) => SetMetadata(FEATURE_FLAG_KEY, name);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagName = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!flagName) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    const enabled = await this.featureFlagService.isEnabled(flagName, userId, {
      path: request.url,
      method: request.method,
    });

    if (!enabled) {
      throw new ForbiddenException(`Feature flag '${flagName}' is disabled`);
    }

    return true;
  }
}
