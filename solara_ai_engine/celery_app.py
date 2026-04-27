"""
Cortex Call - Celery Worker Configuration
==========================================
Tarefas assíncronas: Lembretes, NPS, Campanhas
"""

import os
from celery import Celery
from celery.schedules import crontab

# Redis como broker (padrão: localhost:6379)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Inicializar Celery
app = Celery(
    "cortex_call",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "solara_ai_engine.tasks.reminders",
        "solara_ai_engine.tasks.nps",
        "solara_ai_engine.tasks.campaigns",
    ],
)

# Configuração
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min max por task
    task_soft_time_limit=240,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Beat Schedule — tarefas agendadas
app.conf.beat_schedule = {
    # A cada 5 minutos: verificar lembretes pendentes
    "check-pending-reminders": {
        "task": "solara_ai_engine.tasks.reminders.process_pending_reminders",
        "schedule": crontab(minute="*/5"),
    },
    # A cada 10 minutos: verificar NPS pendentes
    "check-pending-nps": {
        "task": "solara_ai_engine.tasks.nps.process_pending_nps",
        "schedule": crontab(minute="*/10"),
    },
    # A cada hora: processar campanhas ativas
    "process-active-campaigns": {
        "task": "solara_ai_engine.tasks.campaigns.process_active_campaigns",
        "schedule": crontab(minute=0),  # No topo de cada hora
    },
    # Diariamente às 8h: gerar relatório diário
    "daily-report": {
        "task": "solara_ai_engine.tasks.campaigns.generate_daily_report",
        "schedule": crontab(hour=8, minute=0),
    },
}
