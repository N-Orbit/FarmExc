import { PrismaService } from '../../prisma.service';

export async function calculateSybilPenalty(
  prisma: PrismaService,
  userId: string,
): Promise<number> {
  const sybilProfile = await prisma.sybilProfile.findUnique({
    where: { userId },
  });

  if (!sybilProfile) {
    return 1; // 1 means no penalty (multiplier = 1)
  }

  if (sybilProfile.isFlagged) {
    return 0; // Completely flagged, score multiplier is 0
  }

  // riskScore is assumed to be between 0 and 1
  // multiplier goes down from 1 to 0.2 depending on risk.
  // 0 risk -> 1 multiplier
  // 1 risk -> 0.2 multiplier
  const penaltyMultiplier = Math.max(0.2, 1 - sybilProfile.riskScore * 0.8);

  return penaltyMultiplier;
}
