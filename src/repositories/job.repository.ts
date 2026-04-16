import type { JobStatus } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

export class JobRepository {
  async create(userId: string, imageId: string, queueJobId: string) {
    return prisma.job.create({
      data: {
        userId,
        imageId,
        queueJobId,
        status: "QUEUED",
      },
    });
  }

  async updateStatus(
    queueJobId: string,
    status: JobStatus,
    errorMessage?: string,
    options?: { incrementAttempt?: boolean },
  ) {
    return prisma.job.update({
      where: {
        queueJobId,
      },
      data: {
        status,
        errorMessage,
        ...(options?.incrementAttempt
          ? {
              attempts: {
                increment: 1,
              },
            }
          : {}),
      },
    });
  }

  async listByUser(userId: string) {
    return prisma.job.findMany({
      where: {
        OR: [
          { userId },
          {
            userId: null,
            image: {
              uploadedById: userId,
            },
          },
        ],
      },
      include: {
        image: {
          select: {
            id: true,
            originalFilename: true,
            captions: {
              select: {
                content: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            tags: {
              select: {
                tag: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });
  }

  async deleteByImageAndUser(imageId: string, userId: string) {
    return prisma.job.deleteMany({
      where: {
        imageId,
        userId,
      },
    });
  }

  async countByImage(imageId: string) {
    return prisma.job.count({
      where: {
        imageId,
      },
    });
  }
}
