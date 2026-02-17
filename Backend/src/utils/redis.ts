import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const getRedisUrl = (): string => {
    const url = process.env.REDIS_URL;
    if (!url) {
        throw new Error('REDIS_URL is not defined in environment variables');
    }
    return url;
};

const redis = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null
});

redis.on('connect', () => {
    console.log('Redis connected');
});

redis.on('error', (err: any) => {
    console.error('Redis connection error:', err);
});

export default redis;

