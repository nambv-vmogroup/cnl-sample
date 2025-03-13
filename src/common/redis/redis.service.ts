import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '../../config/config.service';
import Redis from 'ioredis';
// import redis = require('redis');

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: parseInt(this.configService.get('REDIS_PORT'), 10),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000, //
      lazyConnect: true,
    })
    this.client.on('connect', () => {
      Logger.log('Redis client connected');
    });
    this.client.on('ready', () => {
      Logger.log('Redis client ready');
    });
    this.client.on('error', (err) => {
      Logger.error('Redis Client Error', err);
    });
  }

  async onModuleInit() {
    try {
      // Test the connection with a ping
      await this.client.ping();
      Logger.log(
        `[RedisClient] Successfully connected to Redis at ${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}`,
      );
    } catch (error) {
      Logger.error(`Failed to connect to Redis: ${error.message}`, error.stack);
      throw error; // Rethrow to prevent app start if Redis is critical
    }
  }
  async onModuleDestroy() {
    try {
      await this.client.quit();
      Logger.log('Redis connection closed gracefully');
    } catch (error) {
      Logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
