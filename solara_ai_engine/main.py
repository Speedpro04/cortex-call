"""
Cortex Call - Sistema Completo de Agendamento + NPS + Solara AI
Backend FastAPI com todas as funcionalidades
"""

import os
import re
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv
import google.generativeai as genai
import httpx

load_dotenv()

app = FastAPI(
    title="Cortex Call - Sistema de Agendamento",
    description="Sistema completo para clínicas médicas: Agendamento, NPS, Lembretes e Solara AI",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# SETUP
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://pkcfkpemxkbmcsjbloob.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "axos-evoapi")

# ==========================================
# Pydantic Models
# ==========================================
class AppointmentCreate(BaseModel):
    clinic_id: str
    patient_id: str
    specialist_id: str
    appointment_time: str
    tipo: str = "consulta"
    motivo: Optional[str] = None
    valor: Optional[float] = None

class AppointmentUpdate(BaseModel):
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None

class CancellationCreate(BaseModel):
    appointment_id: str
    motivo_cancelamento: str
    tipo_cancelamento: str = "paciente"
    reagendado: bool = False

class NPSResponse(BaseModel):
    appointment_id: str
    score: int
    feedback: Optional[str] = None
    motivo: Optional[str] = None
    would_return: Optional[bool] = None
    recommend: Optional[bool] = None

class ChatMessage(BaseModel):
    message: str
    phone: str
    clinic_id: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None

class AvailableSlotsRequest(BaseModel):
    specialist_id: str
    date: str

# ==========================================
# PROMPTS DA SOLARA (IA HUMANIZADA)
# ==========================================
def get_solara_prompt(temperatura: str = "novo", paciente_nome: Optional[str] = None) -> str:
    """Prompt master da Solara - IA humanizada e empática"""
    
    nome = f", {paciente_nome.split(' ')[0]}" if paciente_nome else ""
    
    return f"""Você é a SOLARA, assistente virtual de atendimento da clínica médica Cortex Call.
Você NÃO é um robô. Você é uma pessoa calorosa, empática e profissional.

PERSONALIDADE:
- Tom: Amigável, acolhedor, como uma amiga que trabalha na recepção
- Linguagem: Natural, sem formalidades excessivas
- Empatia: Sempre demonstre entender o sentimento do paciente
- Honestidade: Se não souber algo, diga que vai verificar
- Proatividade: Antecipe necessidades e ofereça ajuda

REGRAS DE COMPORTAMENTO:
1. Use emojis de forma natural (1-2 por mensagem), nunca Abuse
2. Use o nome do paciente quando conhecer: "Oi{nome}!"
3. Sea BREVE: máximo 4 frases curtas por mensagem
4. Para AGENDAR: colete specialty, preferência de dia/horário
5. Para REAGENDAR: seja compreensiva "A vida acontece!"
6. Para CANCELAR: demonstre preocupação "Espero que esteja bem!"
7. Para NPS: agradeça e seja genuinamente interessada
8. Para EMERGÊNCIA: oriente o paciente a procurar ajuda profissional

RESPONDAS SEMPRE em português brasileiro informal, como uma conversa de WhatsApp entre amigas."""

def get_agendamento_prompt(context: str, paciente_nome: Optional[str] = None) -> str:
    """Prompt específico para agendamento"""
    return f"""Você é a SOLARA, recepcionista virtual da clínica.
{nome_prompt(paciente_nome)}
{context}

Quando um paciente quiser agendar:
1. Saude calorosamente
2. Pergunte: especialidade, médico preference, melhor dia/horário
3. Confirme os dados e diga que vai verificar disponibilidade
4. Use frases como: "Deixa eu ver...", "Achei! Tenemos..."

Quando um paciente quiser reagendar:
1. Seja compreensiva: "Claro, sem problemas!"
2. Pergunte a nova preferência
3. Seja rápida na resposta

Quando um paciente quiser cancelar:
1. Demonstre preocupação genuína: "Ah, espero que esteja bem!"
2. Ofereça reagendar se for o caso
3. Lembre da política de 24h com gentileza"""

def nome_prompt(nome: Optional[str]) -> str:
    if nome:
        primeiro = nome.split(' ')[0]
        return f"Sempre que possível, chame a pessoa pelo nome: '{primeiro}'."
    return "Se não souber o nome, seja igualmente calorosa."

# ==========================================
# ROUTES - Health
# ==========================================
@app.get("/")
def read_root():
    return {
        "name": "Cortex Call - Sistema de Agendamento",
        "version": "2.0.0",
        "solara": "Olá! Sou a Solara, sua assistente virtual! 😊 Como posso ajudar?",
        "status": "online"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "supabase": bool(SUPABASE_KEY),
        "gemini": bool(GEMINI_API_KEY),
        "evolution": bool(EVOLUTION_API_URL)
    }

# ==========================================
# ROUTES - AGENDAMENTO
# ==========================================
@app.get("/api/appointments/available-slots")
async def get_available_slots(specialist_id: str, date: str):
    """Busca horários disponíveis para um médico na data"""
    try:
        # Buscar schedule do médico
        weekday = datetime.strptime(date, "%Y-%m-%d").weekday()
        
        schedule = supabase.table("schedules").select("*").eq("specialist_id", specialist_id).eq("weekday", weekday).eq("ativo", True).execute()
        
        if not schedule.data:
            return {"success": True, "slots": [], "message": "Médico não atende neste dia"}
        
        schedule_data = schedule.data[0]
        start = datetime.strptime(str(schedule_data["start_time"]), "%H:%M:%S")
        end = datetime.strptime(str(schedule_data["end_time"]), "%H:%M:%S")
        interval = schedule_data.get("interval_minutes", 30)
        
        # Gerar slots
        slots = []
        current = start
        while current < end:
            slot_time = datetime.strptime(date, "%Y-%m-%d").replace(hour=current.hour, minute=current.minute)
            
            # Verificar se já está ocupado
            existing = supabase.table("appointments").select("id").eq("specialist_id", specialist_id).eq("appointment_time", slot_time.isoformat()).eq("status", "scheduled").execute()
            
            if not existing.data:
                slots.append({
                    "time": slot_time.strftime("%H:%M"),
                    "available": True
                })
            current += timedelta(minutes=interval)
        
        return {"success": True, "slots": slots, "doctor": schedule_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments")
async def get_appointments(clinic_id: str, date: Optional[str] = None, specialist_id: Optional[str] = None):
    """Lista agendamentos da clínica"""
    try:
        query = supabase.table("appointments").select("*, patients(nome_completo, telefone), specialists(nome, especialidade)").eq("clinic_id", clinic_id).order("appointment_time", desc=False)
        
        if date:
            query = query.like("appointment_time", f"{date}%")
        if specialist_id:
            query = query.eq("specialist_id", specialist_id)
        
        result = query.execute()
        
        appointments = []
        for a in (result.data or []):
            appointments.append({
                "id": a["id"],
                "patient": a["patients"]["nome_completo"] if a.get("patients") else "Não identificado",
                "patient_phone": a["patients"]["telefone"] if a.get("patients") else "",
                "doctor": a["specialists"]["nome"] if a.get("specialists") else "A definir",
                "specialty": a["specialists"]["especialidade"] if a.get("specialists") else "",
                "date": a["appointment_time"][:10] if a.get("appointment_time") else "",
                "time": a["appointment_time"][11:16] if a.get("appointment_time") else "",
                "status": a["status"],
                "tipo": a["tipo"],
                "motivo": a.get("motivo", ""),
                "valor": a.get("valor", 0),
                "paid": a.get("paid", False),
                "nps_score": a.get("nps_score"),
            })
        
        return {"success": True, "appointments": appointments}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/appointments")
async def create_appointment(data: AppointmentCreate, background: BackgroundTasks):
    """Cria novo agendamento"""
    try:
        # Verificar conflito
        conflict = supabase.table("appointments").select("id").eq("specialist_id", data.specialist_id).eq("appointment_time", data.appointment_time).eq("status", "scheduled").execute()
        
        if conflict.data:
            raise HTTPException(status_code=400, detail="Horário já ocupado")
        
        # Buscar duração do médico
        specialist = supabase.table("specialists").select("duracao_consulta").eq("id", data.specialist_id).execute()
        duration = specialist.data[0]["duracao_consulta"] if specialist.data else 30
        
        appointment_time = datetime.fromisoformat(data.appointment_time.replace("Z", "+00:00"))
        end_time = appointment_time + timedelta(minutes=duration)
        
        new_appointment = {
            "clinic_id": data.clinic_id,
            "patient_id": data.patient_id,
            "specialist_id": data.specialist_id,
            "appointment_time": data.appointment_time,
            "appointment_end_time": end_time.isoformat(),
            "tipo": data.tipo,
            "status": "scheduled",
            "motivo": data.motivo,
            "valor": data.valor,
        }
        
        result = supabase.table("appointments").insert(new_appointment).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erro ao criar agendamento")
        
        appointment = result.data[0]
        
        # Enviar confirmação via WhatsApp em background
        background.add_task(send_confirmation_message, appointment["id"])
        
        return {"success": True, "appointment": appointment}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, data: AppointmentUpdate):
    """Atualiza agendamento (reagendar)"""
    try:
        updates = {}
        if data.appointment_time:
            updates["appointment_time"] = data.appointment_time
            # Recalcular end_time
            specialist = supabase.table("appointments").select("specialist_id").eq("id", appointment_id).execute()
            if specialist.data:
                spec = supabase.table("specialists").select("duracao_consulta").eq("id", specialist.data[0]["specialist_id"]).execute()
                duration = spec.data[0]["duracao_consulta"] if spec.data else 30
                new_time = datetime.fromisoformat(data.appointment_time.replace("Z", "+00:00"))
                updates["appointment_end_time"] = (new_time + timedelta(minutes=duration)).isoformat()
        
        if data.status:
            updates["status"] = data.status
        if data.observacoes:
            updates["observacoes"] = data.observacoes
        
        result = supabase.table("appointments").update(updates).eq("id", appointment_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        return {"success": True, "appointment": result.data[0]}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: str, cancellation: CancellationCreate):
    """Cancela agendamento"""
    try:
        # Buscar agendamento
        appointment = supabase.table("appointments").select("*").eq("id", appointment_id).execute()
        
        if not appointment.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        appt = appointment.data[0]
        
        # Atualizar status
        supabase.table("appointments").update({"status": "cancelled"}).eq("id", appointment_id).execute()
        
        # Registrar cancelamento
        supabase.table("appointment_cancellations").insert({
            "appointment_id": appointment_id,
            "clinic_id": appt["clinic_id"],
            "patient_id": appt["patient_id"],
            "motivo_cancelamento": cancellation.motivo_cancelamento,
            "tipo_cancelamento": cancellation.tipo_cancelamento,
            "reagendado": cancellation.reagendado,
        }).execute()
        
        # Cancelar lembretes pendentes
        supabase.table("appointment_reminders").update({"status": "cancelled"}).eq("appointment_id", appointment_id).eq("status", "pending").execute()
        
        return {"success": True, "message": "Agendamento cancelado"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUTES - SPECIALISTS & SCHEDULES
# ==========================================
@app.get("/api/specialists")
async def get_specialists(clinic_id: str):
    """Lista médicos da clínica"""
    try:
        result = supabase.table("specialists").select("*").eq("clinic_id", clinic_id).eq("ativo", True).execute()
        
        specialists = []
        for s in (result.data or []):
            # Buscar schedules
            schedules = supabase.table("schedules").select("*").eq("specialist_id", s["id"]).eq("ativo", True).execute()
            
            week_map = {0: "Segunda", 1: "Terça", 2: "Quarta", 3: "Quinta", 4: "Sexta", 5: "Sábado", 6: "Domingo"}
            schedule_text = ", ".join([week_map.get(sch["weekday"], "?") + f" ({sch['start_time'][:5]}-{sch['end_time'][:5]})" for sch in (schedules.data or [])])
            
            specialists.append({
                **s,
                "schedule_text": schedule_text or "A combinar"
            })
        
        return {"success": True, "specialists": specialists}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/specialists/{specialist_id}/availability")
async def get_specialist_availability(specialist_id: str, days: int = 7):
    """Mostra disponibilidade do médico para os próximos dias"""
    try:
        # Buscar schedules do médico
        schedules = supabase.table("schedules").select("*").eq("specialist_id", specialist_id).eq("ativo", True).execute()
        
        if not schedules.data:
            return {"success": True, "availability": [], "message": "Nenhum horário cadastrado"}
        
        availability = []
        today = datetime.now().date()
        
        for i in range(days):
            current_date = today + timedelta(days=i)
            weekday = current_date.weekday()
            
            # Verificar se o médico atende nesse dia
            day_schedule = next((s for s in schedules.data if s["weekday"] == weekday), None)
            
            if day_schedule:
                # Buscar horários ocupados
                busy = supabase.table("appointments").select("appointment_time").eq("specialist_id", specialist_id).like("appointment_time", f"{current_date}%").eq("status", "scheduled").execute()
                busy_times = [a["appointment_time"][11:16] for a in (busy.data or [])]
                
                availability.append({
                    "date": current_date.isoformat(),
                    "weekday": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][weekday],
                    "start": day_schedule["start_time"][:5],
                    "end": day_schedule["end_time"][:5],
                    "busy_times": busy_times,
                    "available_count": len(busy_times)
                })
        
        return {"success": True, "availability": availability}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUTES - LEMBRETES
# ==========================================
@app.get("/api/reminders/pending")
async def get_pending_reminders():
    """Busca lembretes pendentes para enviar (para o cron job)"""
    try:
        now = datetime.now()
        future = now + timedelta(minutes=5)
        
        result = supabase.table("appointment_reminders").select("*, appointments(appointment_time, tipo), patients(nome_completo, telefone), specialists(nome)").eq("status", "pending").lte("scheduled_for", future.isoformat()).execute()
        
        reminders = []
        for r in (result.data or []):
            reminders.append({
                "id": r["id"],
                "tipo": r["tipo"],
                "message": r["message"],
                "phone": r["patients"]["telefone"] if r.get("patients") else "",
                "patient_name": r["patients"]["nome_completo"] if r.get("patients") else "",
                "doctor": r["specialists"]["nome"] if r.get("specialists") else "",
                "appointment_time": r["appointments"]["appointment_time"] if r.get("appointments") else "",
                "scheduled_for": r["scheduled_for"]
            })
        
        return {"success": True, "reminders": reminders}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reminders/{reminder_id}/send")
async def send_reminder(reminder_id: str, background: BackgroundTasks):
    """Envia um lembrete específico"""
    try:
        reminder = supabase.table("appointment_reminders").select("*, patients(telefone)").eq("id", reminder_id).execute()
        
        if not reminder.data:
            raise HTTPException(status_code=404, detail="Lembrete não encontrado")
        
        r = reminder.data[0]
        phone = r["patients"]["telefone"] if r.get("patients") else ""
        
        if not phone:
            raise HTTPException(status_code=400, detail="Telefone não encontrado")
        
        # Enviar
        await send_whatsapp(phone, r["message"])
        
        # Atualizar status
        supabase.table("appointment_reminders").update({
            "status": "sent",
            "sent_at": datetime.now().isoformat()
        }).eq("id", reminder_id).execute()
        
        return {"success": True}
    
    except Exception as e:
        supabase.table("appointment_reminders").update({"status": "failed", "error_message": str(e)}).eq("id", reminder_id).execute()
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUTES - NPS
# ==========================================
@app.get("/api/nps/pending")
async def get_pending_nps():
    """Busca consultas finalizadas sem NPS enviado (para o cron job)"""
    try:
        # Consultas completadas há mais de 30 min sem NPS
        cutoff = datetime.now() - timedelta(minutes=30)
        
        result = supabase.table("appointments").select("*, patients(nome_completo, telefone), specialists(nome)").eq("status", "completed").eq("nps_sent", False).lt("appointment_time", cutoff.isoformat()).execute()
        
        surveys = []
        for a in (result.data or []):
            # Buscar template da clínica
            survey_config = supabase.table("nps_surveys").select("template_mensagem").eq("clinic_id", a["clinic_id"]).eq("active", True).execute()
            
            template = survey_config.data[0]["template_mensagem"] if survey_config.data else None
            
            if template:
                message = template.replace("{nome_paciente}", a["patients"]["nome_completo"].split(" ")[0] if a.get("patients") else "Paciente")
                message = message.replace("{nome_medico}", a["specialists"]["nome"] if a.get("specialists") else "médico")
            else:
                message = f"Olá{a['patients']['nome_completo'].split(' ')[0] if a.get('patients') else ''}! 😊 Como foi sua consulta de hoje? Sua opinião é muito importante para melhorarmos! De 0 a 10, como você avalia sua experiência?"
            
            surveys.append({
                "appointment_id": a["id"],
                "phone": a["patients"]["telefone"] if a.get("patients") else "",
                "patient_name": a["patients"]["nome_completo"] if a.get("patients") else "",
                "message": message,
                "clinic_id": a["clinic_id"]
            })
        
        return {"success": True, "surveys": surveys}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/nps/send/{appointment_id}")
async def send_nps_survey(appointment_id: str, background: BackgroundTasks):
    """Envia pesquisa NPS para uma consulta"""
    try:
        appointment = supabase.table("appointments").select("*, patients(nome_completo, telefone), specialists(nome), clinic_id").eq("id", appointment_id).execute()
        
        if not appointment.data:
            raise HTTPException(status_code=404, detail="Consulta não encontrada")
        
        a = appointment.data[0]
        
        message = f"""Olá{a['patients']['nome_completo'].split(' ')[0] if a.get('patients') else ''}! 😊

Como foi sua consulta com {a['specialists']['nome'] if a.get('specialists') else 'nosso médico'} hoje?

Sua opinião é muito importante para melhorarmos sempre! 💜

Numa escala de 0 a 10, quanto você avalia sua experiência conosco?

0 = Péssimo | 10 = Excelente"""

        if a.get("patients") and a["patients"].get("telefone"):
            background.add_task(send_whatsapp, a["patients"]["telefone"], message)
            supabase.table("appointments").update({"nps_sent": True}).eq("id", appointment_id).execute()
        
        return {"success": True, "message": "NPS enviado"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/nps/response")
async def submit_nps_response(response: NPSResponse):
    """Recebe resposta do NPS"""
    try:
        # Buscar dados do appointment
        appt = supabase.table("appointments").select("clinic_id, patient_id").eq("id", response.appointment_id).execute()
        
        if not appt.data:
            raise HTTPException(status_code=404, detail="Consulta não encontrada")
        
        clinic_id = appt.data[0]["clinic_id"]
        
        # Salvar resposta
        supabase.table("nps_responses").insert({
            "appointment_id": response.appointment_id,
            "clinic_id": clinic_id,
            "patient_id": appt.data[0]["patient_id"],
            "score": response.score,
            "feedback": response.feedback,
            "motivo": response.motivo,
            "would_return": response.would_return,
            "recommend": response.recommend,
        }).execute()
        
        # Resposta automática baseada no score
        if response.score <= 6:
            reply = f"Obrigada pelo feedback, {appt.data[0]['patient_id']}! Lamentamos que não tenha sido perfeito. Vou registrar suas preocupações para melhorarmos. Nossa equipe pode entrar em contato?"
        elif response.score <= 8:
            reply = "Que bom saber que você ficou satisfeito! 😊 Obrigada pela avaliação. Continuamos sempre melhorando!"
        else:
            reply = "Uau! Que alegria saber que sua experiência foi excelente! 🥰 Muito obrigada! Seu retorno é sempre muito bem-vindo!"
        
        # Atualizar appointment
        supabase.table("appointments").update({"nps_score": response.score}).eq("id", response.appointment_id).execute()
        
        return {"success": True, "reply": reply}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nps/stats")
async def get_nps_stats(clinic_id: str, days: int = 30):
    """Estatísticas de NPS"""
    try:
        cutoff = datetime.now() - timedelta(days=days)
        
        responses = supabase.table("nps_responses").select("*").eq("clinic_id", clinic_id).gte("created_at", cutoff.isoformat()).execute()
        
        if not responses.data:
            return {
                "success": True,
                "stats": {
                    "total_responses": 0,
                    "average_score": 0,
                    "nps_score": 0,
                    "detractors": 0,
                    "passives": 0,
                    "promoters": 0,
                    "satisfaction_rate": "0%"
                }
            }
        
        scores = [r["score"] for r in responses.data]
        avg_score = sum(scores) / len(scores)
        
        detractors = len([s for s in scores if s <= 6])
        passives = len([s for s in scores if 7 <= s <= 8])
        promoters = len([s for s in scores if s >= 9])
        
        nps = ((promoters - detractors) / len(scores)) * 100 if scores else 0
        
        return {
            "success": True,
            "stats": {
                "total_responses": len(scores),
                "average_score": round(avg_score, 1),
                "nps_score": round(nps, 1),
                "detractors": detractors,
                "passives": passives,
                "promoters": promoters,
                "detractors_pct": f"{round((detractors/len(scores))*100, 1)}%",
                "passives_pct": f"{round((passives/len(scores))*100, 1)}%",
                "promoters_pct": f"{round((promoters/len(scores))*100, 1)}%",
                "satisfaction_rate": f"{round((promoters/len(scores))*100, 1)}%"
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUTES - SOLARA AI (Chat Humanizado)
# ==========================================
@app.post("/api/chat/solara")
async def chat_with_solara(message: ChatMessage):
    """Chat com a Solara - IA humanizada"""
    try:
        # Identificar intent
        intent = detect_intent(message.message)
        
        # Buscar contexto RAG
        rag_context = get_rag_context(message.message)
        
        # Buscar dados do paciente se telefone existir
        patient_data = None
        if message.phone:
            patient = supabase.table("patients").select("*").eq("telefone", message.phone.replace(/\D/g, "")).execute()
            if patient.data:
                patient_data = patient.data[0]
                message.patient_name = patient_data.get("nome_completo")
        
        # Gerar resposta baseada no intent
        response_text = await generate_solara_response(
            message=message.message,
            intent=intent,
            patient_name=message.patient_name,
            patient_data=patient_data,
            rag_context=rag_context
        )
        
        # Salvar conversa
        supabase.table("ai_conversations").insert({
            "clinic_id": message.clinic_id or "unknown",
            "patient_id": message.patient_id,
            "telefone_remetente": message.phone,
            "role": "user",
            "content": message.message,
            "intent_detected": intent
        }).execute()
        
        supabase.table("ai_conversations").insert({
            "clinic_id": message.clinic_id or "unknown",
            "patient_id": message.patient_id,
            "telefone_remetente": message.phone,
            "role": "assistant",
            "content": response_text,
            "intent_detected": intent,
            "action_taken": intent
        }).execute()
        
        # Enviar via WhatsApp se for uma mensagem
        if message.phone:
            await send_whatsapp(message.phone, response_text)
        
        return {
            "success": True,
            "response": response_text,
            "intent": intent,
            "patient_name": message.patient_name
        }
    
    except Exception as e:
        return {
            "success": False,
            "response": "Olá! Desculpe, tive um probleminha. 😅 Pode me dizer de novo? Estou aqui para ajudar!",
            "error": str(e)
        }

# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================
def detect_intent(message: str) -> str:
    """Detecta a intenção do usuário"""
    msg = message.lower()
    
    if any(k in msg for k in ["agendar", "marcar", "consulta", "queria", "quero"]):
        return "agendar"
    if any(k in msg for k in ["reagendar", "mudar", "alterar", "outro dia"]):
        return "reagendar"
    if any(k in msg for k in ["cancelar", "desmarcar", "não posso"]):
        return "cancelar"
    if any(k in msg for k in ["disponível", "horário", "vagas", "quando"]):
        return "verificar_disponibilidade"
    if any(k in msg for k in ["confirmar", "confirmado", "vou sim"]):
        return "confirmar"
    if any(k in msg for k in ["nps", "avaliação", "nota", "pesquisa", "opiniao"]):
        return "nps"
    if any(k in msg for k in ["retorno", "voltar", "revisão"]):
        return "retorno"
    if any(k in msg for k in ["lembre", "lembrar", "esqueci"]):
        return "lembrete"
    
    return "geral"

def get_rag_context(message: str) -> str:
    """Busca contexto relevante da RAG"""
    try:
        result = supabase.table("rag_knowledge_base").select("*").execute()
        
        if not result.data:
            return ""
        
        msg_lower = message.lower()
        matched = [r for r in result.data if any(k.lower() in msg_lower for k in (r.get("keywords") or []))]
        
        if matched:
            return "\n".join([f"[{r['topic']}]: {r['context']}" for r in matched[:3]])
        
        return ""
    except:
        return ""

async def generate_solara_response(message: str, intent: str, patient_name: Optional[str], patient_data: dict, rag_context: str) -> str:
    """Gera resposta humanizada da Solara"""
    
    prompts = {
        "agendar": f"""{get_solara_prompt(paciente_nome=patient_name)}

Contexto do paciente: {f"Cliente há tempo: {patient_data.get('temperatura_lead', 'novo')}" if patient_data else "Novo paciente"}
{rag_context}

O paciente escreveu: "{message}"

Responda de forma natural e coletando as informações necessárias para agendar.""",
        
        "reagendar": f"""{get_solara_prompt(paciente_nome=patient_name)}

O paciente quer REAGENDAR: "{message}"

Sea compreensiva e ajude a encontrar o melhor horário.""",
        
        "cancelar": f"""{get_solara_prompt(paciente_nome=patient_name)}

O paciente quer CANCELAR: "{message}"

Sea empática e verifique se realmente quer cancelar ou se prefere reagendar.""",
        
        "geral": f"""{get_solara_prompt(paciente_nome=patient_name)}

{rag_context}

O paciente pergunta: "{message}"

Responda de forma útil e humanizada."""
    }
    
    prompt = prompts.get(intent, prompts["geral"])
    
    if not GEMINI_API_KEY:
        return get_fallback_response(intent, patient_name)
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content(prompt)
        return result.text
    except:
        return get_fallback_response(intent, patient_name)

def get_fallback_response(intent: str, patient_name: Optional[str]) -> str:
    """Respostas pré-definidas caso Gemini não funcione"""
    nome = f", {patient_name.split(' ')[0]}" if patient_name else ""
    
    responses = {
        "agendar": f"Olá{nome}! 😊 Que bom que quer agendar! Qual especialidade você precisa e qual horário prefere?",
        "reagendar": f"Sem problema{nome}! 😊 A vida é corrida. Qual dia e horário prefere?",
        "cancelar": f"Entendo{nome}! 🙏 Espero que esteja bem. Qual o motivo do cancelamento? Posso ajudar com algo?",
        "geral": f"Olá{nome}! 😊 Sou a Solara, sua assistente. Como posso te ajudar hoje?"
    }
    
    return responses.get(intent, responses["geral"])

async def send_whatsapp(phone: str, text: str):
    """Envia mensagem via Evolution API"""
    if not EVOLUTION_API_URL or not EVOLUTION_API_KEY:
        print(f"[WhatsApp] Não configurado - Mensagem para {phone}: {text}")
        return
    
    try:
        phone_clean = re.sub(r'\D', '', phone)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}",
                headers={"apikey": EVOLUTION_API_KEY, "Content-Type": "application/json"},
                json={
                    "number": phone_clean,
                    "options": {"delay": 1000, "presence": "composing"},
                    "textMessage": {"text": text}
                },
                timeout=30.0
            )
        
        return response.json()
    except Exception as e:
        print(f"[WhatsApp] Erro ao enviar: {e}")

async def send_confirmation_message(appointment_id: str):
    """Envia confirmação de agendamento"""
    try:
        appt = supabase.table("appointments").select("*, patients(telefone, nome_completo), specialists(nome)").eq("id", appointment_id).execute()
        
        if not appt.data:
            return
        
        a = appt.data[0]
        phone = a["patients"]["telefone"] if a.get("patients") else ""
        patient_name = a["patients"]["nome_completo"].split(" ")[0] if a.get("patients") else ""
        
        if not phone:
            return
        
        date = datetime.fromisoformat(a["appointment_time"].replace("Z", "+00:00"))
        
        message = f"""Olá, {patient_name}! 😊

Sua consulta foi confirmada! 🎉

📅 Data: {date.strftime('%d/%m/%Y')}
⏰ Horário: {date.strftime('%H:%M')}
👨‍⚕️ Dr(a). {a['specialists']['nome'] if a.get('specialists') else 'Médico'}

Enviaremos lembretes 24h e 2h antes. 

Qualquer dúvida, é só chamar! 💜"""
        
        await send_whatsapp(phone, message)
    
    except Exception as e:
        print(f"[Confirmação] Erro: {e}")

# ==========================================
# Iniciar servidor
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)