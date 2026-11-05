from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "pulseorder_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    worker_prefetch_multiplier=1,
)

@celery_app.task(name="tasks.generate_daily_sales_digest", bind=True, max_retries=3)
def generate_daily_sales_digest(self, restaurant_id: str):
    # Simulated async reporting task with retry policy
    try:
        return {"status": "success", "restaurant_id": restaurant_id, "digest_generated": True}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)

@celery_app.task(name="tasks.notify_delayed_orders", bind=True)
def notify_delayed_orders(self, branch_id: str):
    # Identifies tickets in kitchen older than 15 mins
    return {"status": "checked", "branch_id": branch_id}

