// lib/redis.ts

import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL as string, {
  tls: undefined, // TLS 지원 안 함 (rediss:// 사용 안 함)
  enableAutoPipelining: true, // 성능 최적화 옵션
});

export default redis;
