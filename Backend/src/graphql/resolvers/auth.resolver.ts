import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserType } from '../types/user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NonceService } from '../../auth/services/nonce.service';
import { WalletService } from '../../auth/services/wallet.service';
import { JwtAuthService } from '../../auth/services/jwt-auth.service';
import { RequestNonceDto } from '../../auth/dto/request-nonce.dto';
import { WalletLoginDto } from '../../auth/dto/wallet-login.dto';
import { RefreshTokenDto } from '../../auth/dto/refresh-token.dto';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly nonceService: NonceService,
    private readonly walletService: WalletService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @Mutation(() => String, { name: 'requestNonce' })
  async requestNonce(@Args('publicKey') publicKey: string) {
    const result = await this.nonceService.generateNonce(publicKey);
    return result.nonce;
  }

  @Mutation(() => Object, { name: 'walletLogin' })
  async walletLogin(@Args('input') input: WalletLoginDto) {
    const nonceRecord = await this.nonceService.validateNonce(
      input.nonce,
      input.publicKey,
    );

    const message = `Sign this message to authenticate with Stellara: ${input.nonce}`;

    const isValid = await this.walletService.verifySignature(
      input.publicKey,
      input.signature,
      message,
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    await this.nonceService.markNonceUsed(input.nonce);

    let user = await this.walletService.findUserByWallet(input.publicKey);
    let isNewUser = false;

    if (!user) {
      user = await this.walletService.createUserWithWallet(input.publicKey);
      isNewUser = true;
    }

    await this.walletService.updateLastUsed(input.publicKey);

    const accessToken = await this.jwtAuthService.generateAccessToken(user.id);
    const refreshTokenData = await this.jwtAuthService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshTokenId: refreshTokenData.id,
      refreshToken: refreshTokenData.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  @Mutation(() => Object, { name: 'refreshToken' })
  async refreshToken(@Args('input') input: RefreshTokenDto) {
    const tokens = await this.jwtAuthService.refreshAccessToken(
      input.refreshTokenId,
      input.refreshToken,
    );

    return {
      accessToken: tokens.accessToken,
      refreshTokenId: tokens.newRefreshTokenId,
      refreshToken: tokens.newRefreshToken,
    };
  }

  @Mutation(() => String, { name: 'logout' })
  @UseGuards(JwtAuthGuard)
  async logout(@Context() context) {
    await this.jwtAuthService.revokeAllUserRefreshTokens(context.req.user.id);
    return 'Logged out successfully';
  }
}
