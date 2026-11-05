import json
import logging
from typing import Any, Optional
import redis
from app.core.config import settings

logger = logging.getLogger("pulseorder.cache")

class CacheService:
    def __init__(self):
        self.redis_client = None
        self._memory_cache = {}
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, socket_timeout=1.0)
            self.redis_client.ping()
            logger.info("Connected to Redis cache successfully.")
        except Exception as e:
            logger.warning(f"Redis unavailable, falling back to local memory cache: {e}")
            self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val:
                    return json.loads(val.decode("utf-8"))
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        return self._memory_cache.get(key)

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        val_str = json.dumps(value)
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl_seconds, val_str)
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")
        
        self._memory_cache[key] = value

    def invalidate(self, key: str):
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)

cache_service = CacheService()

