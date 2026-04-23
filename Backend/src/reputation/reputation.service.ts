import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { calculateTrustScore } from './calculators/trust-score.calculator';
import { calculateEndorsementWeight } from './calculators/endorsement.calculator';
import { calculateSybilPenalty } from './calculators/sybil-penalty.calculator';
import * as crypto from 'crypto';

@Injectable()
export class ReputationService {
	constructor(private readonly prisma: PrismaService) {}

	async updateTrustScore(userId: string): Promise<number> {
		let baseScore = await calculateTrustScore(this.prisma, userId);
		const endorsementBonus = await calculateEndorsementWeight(this.prisma, userId);
		const sybilMultiplier = await calculateSybilPenalty(this.prisma, userId);

		// Aggregate logic: apply bonus, then multiply by sybil penalty
		const aggregatedScore = Math.floor((baseScore + endorsementBonus) * sybilMultiplier);

		await this.prisma.user.update({
			where: { id: userId },
			data: { trustScore: aggregatedScore },
		});

		// Upsert the ReputationScore entity for the detail view
		await this.prisma.reputationScore.upsert({
			where: { subjectId: userId },
			update: { compositeScore: aggregatedScore },
			create: {
				subjectId: userId,
				compositeScore: aggregatedScore,
				successRateScore: baseScore,
				peerRatingScore: endorsementBonus,
				contributionSizeScore: 0,
				communityFeedbackScore: 0,
				activityCount: 1, // Minimum activity
			}
		});

		return aggregatedScore;
	}

	async getReputation(userId: string) {
		const userReputation = await this.prisma.reputationScore.findUnique({
			where: { subjectId: userId },
		});
		if (!userReputation) throw new NotFoundException('Reputation not found');
		return userReputation;
	}

	async endorseUser(endorserId: string, endorsedId: string, weight: number, context?: string) {
		const result = await this.prisma.reputationEndorsement.upsert({
			where: {
				endorserId_endorsedId: { endorserId, endorsedId },
			},
			update: { weight, context },
			create: { endorserId, endorsedId, weight, context },
		});

		// Trigger an update
		await this.updateTrustScore(endorsedId);
		return result;
	}

	async fileDispute(disputerId: string, disputedId: string, reason: string, referenceId?: string) {
		return await this.prisma.reputationDispute.create({
			data: {
				disputerId,
				disputedId,
				reason,
				referenceId,
			}
		});
	}

	// Privacy-preserving proof
	async generateProof(userId: string, threshold: number): Promise<{ isValid: boolean, proof: string }> {
		const scoreRow = await this.prisma.reputationScore.findUnique({ where: { subjectId: userId } });
		const currentScore = scoreRow?.compositeScore || 0;
		const isValid = currentScore >= threshold;
		
		// In a real decentralized context, this could generate a Zero-Knowledge proof via a circom integration.
		// For now, we generate an HMAC proving the oracle signed the statement 'user X meets threshold Y'.
		const secret = process.env.ORACLE_SECRET || 'default-oracle-secret';
		const payload = `${userId}:${threshold}:${isValid}`;
		const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');

		return {
			isValid,
			proof: hash,
		};
	}
}
