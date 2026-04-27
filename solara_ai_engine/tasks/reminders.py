"""
Celery Tasks — Lembretes Automáticos
Envia lembretes 24h e 2h antes das consultas via WhatsApp
"""

import os
from datetime import datetime, timedelta
from supabase import create_client
import httpx

from solara_ai_engine.celery_app import app

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://pkcfkpemxkbmcsjbloob.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


async def send_whatsapp(phone: str, message: str, instance: str = "axos-evoapi"):
    """Envia mensagem via Evolution API"""
    if not EVOLUTION_API_URL or not phone:
        return False
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{EVOLUTION_API_URL}/message/sendText/{instance}",
            json={
                "number": phone,
                "options": {"delay": 1200, "presence": "composing"},
                "textMessage": {"text": message},
            },
            headers={"apikey": EVOLUTION_API_KEY, "Content-Type": "application/json"},
            timeout=30,
        )
        return response.status_code == 200


@app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_pending_reminders(self):
    """
    Verifica e envia lembretes pendentes.
    Roda a cada 5 minutos via Celery Beat.
    """
    supabase = get_supabase()
    now = datetime.now()
    future = now + timedelta(minutes=10)
    
    try:
        result = supabase.table("appointment_reminders") \
            .select("*, appointments(appointment_time, tipo), patients(nome_completo, telefone), specialists(nome)") \
            .eq("status", "pending") \
            .lte("scheduled_for", future.isoformat()) \
            .execute()
        
        sent_count = 0
        
        for reminder in (result.data or []):
            phone = reminder.get("patients", {}).get("telefone", "")
            patient_name = reminder.get("patients", {}).get("nome_completo", "Paciente")
            doctor_name = reminder.get("specialists", {}).get("nome", "médico")
            appointment_time = reminder.get("appointments", {}).get("appointment_time", "")
            
            if not phone:
                supabase.table("appointment_reminders").update(
                    {"status": "failed", "error_message": "Telefone não encontrado"}
                ).eq("id", reminder["id"]).execute()
                continue
            
            # Formatar horário
            try:
                appt_dt = datetime.fromisoformat(appointment_time.replace("Z", "+00:00"))
                time_str = appt_dt.strftime("%H:%M")
                date_str = appt_dt.strftime("%d/%m")
            except:
                time_str = "horário agendado"
                date_str = ""
            
            # Gerar mensagem humanizada
            primeiro_nome = patient_name.split(" ")[0] if patient_name else "Paciente"
            
            if reminder.get("tipo") == "24h":
                message = (
                    f"Olá, {primeiro_nome}! 😊\n\n"
                    f"Lembrete: amanhã ({date_str}) você tem consulta às {time_str} "
                    f"com Dr(a). {doctor_name}.\n\n"
                    f"Confirme sua presença respondendo SIM.\n"
                    f"Caso precise reagendar, nos avise! 💙"
                )
            else:
                message = (
                    f"Oi, {primeiro_nome}! ⏰\n\n"
                    f"Sua consulta com Dr(a). {doctor_name} é daqui a 2 horas ({time_str}).\n\n"
                    f"Estamos te esperando! 😊"
                )
            
            # Enviar via WhatsApp
            import asyncio
            success = asyncio.get_event_loop().run_until_complete(
                send_whatsapp(phone, message)
            )
            
            if success:
                supabase.table("appointment_reminders").update({
                    "status": "sent",
                    "sent_at": datetime.now().isoformat(),
                }).eq("id", reminder["id"]).execute()
                sent_count += 1
            else:
                supabase.table("appointment_reminders").update({
                    "status": "failed",
                    "error_message": "Falha no envio WhatsApp",
                }).eq("id", reminder["id"]).execute()
        
        return {"processed": len(result.data or []), "sent": sent_count}
    
    except Exception as exc:
        self.retry(exc=exc)


@app.task
def schedule_reminders_for_appointment(appointment_id: str):
    """
    Cria lembretes (24h e 2h) para um agendamento específico.
    Chamada ao criar um novo agendamento.
    """
    supabase = get_supabase()
    
    appointment = supabase.table("appointments") \
        .select("*, patients(id, telefone), specialists(id)") \
        .eq("id", appointment_id) \
        .single() \
        .execute()
    
    if not appointment.data:
        return {"error": "Agendamento não encontrado"}
    
    appt = appointment.data
    appt_time = datetime.fromisoformat(appt["appointment_time"].replace("Z", "+00:00"))
    
    reminders = []
    
    # Lembrete 24h antes
    reminder_24h = appt_time - timedelta(hours=24)
    if reminder_24h > datetime.now(reminder_24h.tzinfo):
        reminders.append({
            "appointment_id": appointment_id,
            "clinic_id": appt["clinic_id"],
            "patient_id": appt["patients"]["id"] if appt.get("patients") else None,
            "specialist_id": appt["specialists"]["id"] if appt.get("specialists") else None,
            "tipo": "24h",
            "scheduled_for": reminder_24h.isoformat(),
            "status": "pending",
        })
    
    # Lembrete 2h antes
    reminder_2h = appt_time - timedelta(hours=2)
    if reminder_2h > datetime.now(reminder_2h.tzinfo):
        reminders.append({
            "appointment_id": appointment_id,
            "clinic_id": appt["clinic_id"],
            "patient_id": appt["patients"]["id"] if appt.get("patients") else None,
            "specialist_id": appt["specialists"]["id"] if appt.get("specialists") else None,
            "tipo": "2h",
            "scheduled_for": reminder_2h.isoformat(),
            "status": "pending",
        })
    
    if reminders:
        supabase.table("appointment_reminders").insert(reminders).execute()
    
    return {"scheduled": len(reminders)}
