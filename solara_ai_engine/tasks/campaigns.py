"""
Celery Tasks — Campanhas de Recuperação
Processa campanhas ativas e dispara mensagens em massa
"""

import os
from datetime import datetime, timedelta
from supabase import create_client
import google.generativeai as genai

from solara_ai_engine.celery_app import app

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://pkcfkpemxkbmcsjbloob.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@app.task(bind=True, max_retries=2, default_retry_delay=300)
def process_active_campaigns(self):
    """
    Processa campanhas ativas: busca pacientes e agenda envio de mensagens.
    Roda a cada hora via Celery Beat.
    """
    supabase = get_supabase()
    
    try:
        # Buscar campanhas ativas
        result = supabase.table("campaigns") \
            .select("*") \
            .eq("status", "active") \
            .execute()
        
        total_sent = 0
        
        for campaign in (result.data or []):
            # Buscar pacientes elegíveis que ainda não receberam mensagem desta campanha
            sent_messages = supabase.table("campaign_messages") \
                .select("patient_id") \
                .eq("campaign_id", campaign["id"]) \
                .execute()
            
            sent_ids = [m["patient_id"] for m in (sent_messages.data or []) if m.get("patient_id")]
            
            # Buscar pacientes mornos, frios ou perdidos
            query = supabase.table("patients") \
                .select("id, nome_completo, telefone, temperatura_lead, ultima_consulta") \
                .eq("clinic_id", campaign["clinic_id"]) \
                .in_("temperatura_lead", ["morno", "frio", "perdido"])
            
            patients = query.execute()
            
            # Filtrar os que já receberam
            eligible = [p for p in (patients.data or []) if p["id"] not in sent_ids]
            
            # Limitar por batch (10 por hora para não sobrecarregar)
            batch = eligible[:10]
            
            for patient in batch:
                phone = patient.get("telefone", "")
                if not phone:
                    continue
                
                # Personalizar mensagem
                first_name = (patient.get("nome_completo") or "").split(" ")[0] or "Paciente"
                message = campaign.get("template_mensagem", "").replace("{nome}", first_name)
                
                if not message:
                    message = f"Olá, {first_name}! 😊 Sentimos sua falta. Que tal agendar uma revisão?"
                
                # Inserir na fila de mensagens
                supabase.table("campaign_messages").insert({
                    "campaign_id": campaign["id"],
                    "patient_id": patient["id"],
                    "telefone": phone,
                    "message": message,
                    "status": "pending",
                }).execute()
                
                total_sent += 1
            
            # Atualizar contadores da campanha
            new_sent = (campaign.get("enviados_count") or 0) + len(batch)
            supabase.table("campaigns").update({
                "enviados_count": new_sent,
                "pacientes_count": len(patients.data or []),
            }).eq("id", campaign["id"]).execute()
        
        return {"campaigns": len(result.data or []), "messages_queued": total_sent}
    
    except Exception as exc:
        self.retry(exc=exc)


@app.task
def generate_daily_report():
    """
    Gera relatório diário com estatísticas para cada clínica.
    Roda diariamente às 8h via Celery Beat.
    """
    supabase = get_supabase()
    
    try:
        # Buscar todas as clínicas ativas
        clinics = supabase.table("clinics") \
            .select("id, nome_clinica, email") \
            .eq("ativo", True) \
            .execute()
        
        yesterday = datetime.now() - timedelta(days=1)
        yesterday_str = yesterday.strftime("%Y-%m-%d")
        
        reports = []
        
        for clinic in (clinics.data or []):
            clinic_id = clinic["id"]
            
            # Consultas de ontem
            appts = supabase.table("appointments") \
                .select("id, status") \
                .eq("clinic_id", clinic_id) \
                .like("appointment_time", f"{yesterday_str}%") \
                .execute()
            
            total_appts = len(appts.data or [])
            completed = len([a for a in (appts.data or []) if a["status"] == "completed"])
            no_shows = len([a for a in (appts.data or []) if a["status"] == "no_show"])
            
            # NPS do dia
            nps_data = supabase.table("nps_responses") \
                .select("score") \
                .eq("clinic_id", clinic_id) \
                .gte("created_at", yesterday.isoformat()) \
                .execute()
            
            avg_nps = 0
            if nps_data.data:
                scores = [n["score"] for n in nps_data.data]
                avg_nps = sum(scores) / len(scores)
            
            reports.append({
                "clinic": clinic["nome_clinica"],
                "date": yesterday_str,
                "appointments": total_appts,
                "completed": completed,
                "no_shows": no_shows,
                "avg_nps": round(avg_nps, 1),
            })
        
        return {"reports": reports, "clinics_processed": len(reports)}
    
    except Exception as exc:
        return {"error": str(exc)}
