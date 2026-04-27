"""
Celery Tasks — NPS Automático
Envia pesquisa de satisfação após consultas concluídas
"""

import os
from datetime import datetime, timedelta
from supabase import create_client

from solara_ai_engine.celery_app import app

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://pkcfkpemxkbmcsjbloob.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@app.task(bind=True, max_retries=3, default_retry_delay=120)
def process_pending_nps(self):
    """
    Busca consultas completadas sem NPS enviado e agenda o envio.
    Roda a cada 10 minutos via Celery Beat.
    """
    supabase = get_supabase()
    cutoff = datetime.now() - timedelta(minutes=30)
    
    try:
        result = supabase.table("appointments") \
            .select("id, clinic_id, patients(nome_completo, telefone), specialists(nome)") \
            .eq("status", "completed") \
            .eq("nps_sent", False) \
            .lt("appointment_time", cutoff.isoformat()) \
            .limit(20) \
            .execute()
        
        processed = 0
        
        for appt in (result.data or []):
            phone = appt.get("patients", {}).get("telefone", "")
            if not phone:
                continue
            
            patient_name = appt.get("patients", {}).get("nome_completo", "Paciente")
            doctor_name = appt.get("specialists", {}).get("nome", "médico")
            primeiro_nome = patient_name.split(" ")[0]
            
            message = (
                f"Olá, {primeiro_nome}! 😊\n\n"
                f"Como foi sua consulta com Dr(a). {doctor_name} hoje?\n\n"
                f"Sua opinião é muito importante para melhorarmos! 💜\n\n"
                f"Numa escala de 0 a 10, quanto você avalia sua experiência?\n\n"
                f"0 = Péssimo | 10 = Excelente"
            )
            
            # Salvar na fila de conversas para envio
            supabase.table("ai_conversations").insert({
                "clinic_id": appt["clinic_id"],
                "patient_id": None,
                "telefone_remetente": phone,
                "role": "assistant",
                "content": message,
            }).execute()
            
            # Marcar NPS como enviado
            supabase.table("appointments").update({
                "nps_sent": True,
            }).eq("id", appt["id"]).execute()
            
            processed += 1
        
        return {"found": len(result.data or []), "processed": processed}
    
    except Exception as exc:
        self.retry(exc=exc)
