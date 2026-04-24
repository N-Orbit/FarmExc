import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import DataLoader from 'dataloader';

@Injectable()
export class GraphqlService {
  private projectLoader: DataLoader<string, any>;
  private contributionLoader: DataLoader<string, any>;

  constructor(private readonly prisma: PrismaService) {
    this.userLoader = new DataLoader<string, any>(async (ids: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: ids as string[] } },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id) ?? null);
    });

    this.projectLoader = new DataLoader<string, any>(async (ids: readonly string[]) => {
      const projects = await this.prisma.project.findMany({
        where: { id: { in: ids as string[] } },
      });

      const projectMap = new Map(projects.map((p) => [p.id, p]));
      return ids.map((id) => projectMap.get(id) ?? null);
    });

    this.contributionLoader = new DataLoader<string, any>(async (ids: readonly string[]) => {
      const contributions = await this.prisma.contribution.findMany({
        where: { id: { in: ids as string[] } },
      });

      const contributionMap = new Map(contributions.map((c) => [c.id, c]));
      return ids.map((id) => contributionMap.get(id) ?? null);
    });
  }

  async getUserById(id: string) {
    return this.userLoader.load(id);
  }

  async getUsers(limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { items, total, limit, offset };
  }

  async getProjectById(id: string) {
    return this.projectLoader.load(id);
  }

  async getProjects(limit = 20, offset = 0) {
    return this.prisma.project.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContributionsByProjectId(projectId: string) {
    return this.prisma.contribution.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getContributionsByUserId(userId: string) {
    return this.prisma.contribution.findMany({
      where: { investorId: userId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getMilestonesByProjectId(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCalls(limit = 20) {
    return this.prisma.call.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

