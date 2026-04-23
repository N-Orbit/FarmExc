import { PrismaService } from '../../prisma.service';

export async function calculateEndorsementWeight(
  prisma: PrismaService,
  endorsedId: string,
): Promise<number> {
  const endorsements = await prisma.reputationEndorsement.findMany({
    where: { endorsedId },
    include: {
      endorser: true, // We need endorser's trustScore
    },
  });

  if (endorsements.length === 0) {
    return 0; // No endorsement bonus
  }

  // Weight algorithm:
  // We sum the normalized trust score of all endorsers
  // trustScore is out of max 1000 typically, but existing code says 500 default. Let's assume max 1000.
  // Standard weight of an endorsement = endorser.trustScore / 1000 * weight (configured by the endorsement).
  let totalBonus = 0;
  for (const endorsement of endorsements) {
    const endorserTrust = endorsement.endorser.trustScore ?? 500;
    const normalizedTrust = Math.max(0, Math.min(endorserTrust / 1000, 1));
    totalBonus += normalizedTrust * endorsement.weight;
  }

  // Cap the maximal endorsement bonus to 20 points
  return Math.min(totalBonus, 20);
}
