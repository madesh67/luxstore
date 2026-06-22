import { Queue, Worker, Job } from "bullmq";
import { redisClient } from "./redis";
import { logger } from "./logger";
import { cache } from "./redis";
import { prisma } from "./prisma";

// Define Job Payload interfaces
export interface EmailJobPayload {
  to: string;
  subject: string;
  body: string;
  type: string;
}

export interface AnalyticsJobPayload {
  event: string;
  userId?: string;
  details: unknown;
  ip?: string;
}

export interface NotificationJobPayload {
  userId: string;
  title: string;
  message: string;
}

export interface CacheJobPayload {
  pattern: string;
}

const isRedisActive = !!redisClient;

// Helper to run background tasks if Redis isn't active (Mock queue fallback)
const processInMemoryJob = async (queueName: string, name: string, data: unknown) => {
  logger.info(`InMemoryQueue [${queueName}] processing job "${name}" asynchronously.`);
  setTimeout(async () => {
    try {
      await jobProcessors[queueName](name, data);
      logger.info(`InMemoryQueue [${queueName}] job "${name}" completed successfully.`);
    } catch (err: unknown) {
      logger.error(`InMemoryQueue [${queueName}] job "${name}" failed:`, err as Error);
    }
  }, 100);
};

// Queue names
const EMAIL_QUEUE = "email-queue";
const ANALYTICS_QUEUE = "analytics-queue";
const NOTIFICATION_QUEUE = "notification-queue";
const CACHE_QUEUE = "cache-queue";

// Centralized processors for both BullMQ and fallback in-memory systems
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jobProcessors: Record<string, (name: string, data: any) => Promise<void>> = {
  [EMAIL_QUEUE]: async (name, data: EmailJobPayload) => {
    logger.info(`[Email Worker] Sending ${data.type} email to: ${data.to}. Subject: ${data.subject}`);
    // Simulate SMTP delivery or call email client
    if (data.to.includes("fail")) {
      throw new Error("Simulated SMTP delivery failure for testing.");
    }
  },
  [ANALYTICS_QUEUE]: async (name, data: AnalyticsJobPayload) => {
    logger.info(`[Analytics Worker] Logging event: ${data.event} for User: ${data.userId || "GUEST"}`);
    try {
      // Record analytics events in the DB or third-party metrics logs
      logger.info(`[Analytics Database Logged] Event: ${data.event}`);
    } catch (err: unknown) {
      logger.error("[Analytics Worker] Failed to write event:", err as Error);
    }
  },
  [NOTIFICATION_QUEUE]: async (name, data: NotificationJobPayload) => {
    logger.info(`[Notification Worker] Dispatching message to User ${data.userId}: "${data.title}"`);
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          isRead: false,
        },
      });
    } catch (err: unknown) {
      logger.error("[Notification Worker] Failed to create notification:", err as Error);
    }
  },
  [CACHE_QUEUE]: async (name, data: CacheJobPayload) => {
    logger.info(`[Cache Worker] Invalidating cache pattern: ${data.pattern}`);
    await cache.delByPattern(data.pattern);
  },
};

// Initialize BullMQ objects if Redis is connected
const queues: Record<string, Queue> = {};
const workers: Record<string, Worker> = {};

if (isRedisActive) {
  try {
    const queueNames = [EMAIL_QUEUE, ANALYTICS_QUEUE, NOTIFICATION_QUEUE, CACHE_QUEUE];

    for (const qName of queueNames) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bullmqConnection = redisClient as any;

      queues[qName] = new Queue(qName, {
        connection: bullmqConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      });

      workers[qName] = new Worker(
        qName,
        async (job: Job) => {
          await jobProcessors[qName](job.name, job.data);
        },
        { connection: bullmqConnection }
      );

      workers[qName].on("failed", (job: Job | undefined, err: Error) => {
        logger.error(`BullMQ [${qName}] Job ${job?.id} failed:`, err);
      });
    }
  } catch (error: unknown) {
    logger.error("Failed to initialize BullMQ elements:", error as Error);
  }
}

// Public API matching background job requests
export const backgroundJobs = {
  async addEmail(data: EmailJobPayload): Promise<void> {
    if (isRedisActive && queues[EMAIL_QUEUE]) {
      await queues[EMAIL_QUEUE].add("send-email", data);
    } else {
      await processInMemoryJob(EMAIL_QUEUE, "send-email", data);
    }
  },

  async addAnalytics(data: AnalyticsJobPayload): Promise<void> {
    if (isRedisActive && queues[ANALYTICS_QUEUE]) {
      await queues[ANALYTICS_QUEUE].add("log-analytics", data);
    } else {
      await processInMemoryJob(ANALYTICS_QUEUE, "log-analytics", data);
    }
  },

  async addNotification(data: NotificationJobPayload): Promise<void> {
    if (isRedisActive && queues[NOTIFICATION_QUEUE]) {
      await queues[NOTIFICATION_QUEUE].add("create-notification", data);
    } else {
      await processInMemoryJob(NOTIFICATION_QUEUE, "create-notification", data);
    }
  },

  async addCacheInvalidation(data: CacheJobPayload): Promise<void> {
    if (isRedisActive && queues[CACHE_QUEUE]) {
      await queues[CACHE_QUEUE].add("invalidate-cache", data);
    } else {
      await processInMemoryJob(CACHE_QUEUE, "invalidate-cache", data);
    }
  },
};
