from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "payflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.jobs.reminder_tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Schedule daily reminder generation at 9 AM UTC
celery_app.conf.beat_schedule = {
    'generate-reminder-drafts-daily': {
        'task': 'app.jobs.reminder_tasks.generate_reminder_drafts',
        'schedule': 86400.0,  # 24 hours in seconds
    },
    'update-days-overdue-daily': {
        'task': 'app.jobs.reminder_tasks.update_days_overdue',
        'schedule': 86400.0,
    },
}
