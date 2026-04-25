---
tags: [project, solara-connect, odontologia, ai, saas, supabase, evolution-api, next-js]
type: documentation
projeto: Solara Connect Odonto
versao: 2.0
stack: Next.js 14 + Supabase + Gemini AI + Evolution API
status: producao
url_producao: https://solaraconnect.online
repositorio: https://github.com/Speedpro04/odonto_online
deploy: EasyPanel (odonto-connect)
---

# 🦷 Solara Connect Odonto — Segundo Cérebro (Obsidian Edition)

> **MISSÃO ESTRATÉGICA:** Ser a plataforma SaaS de inteligência clínica #1 para clínicas odontológicas brasileiras — focando em **Recuperação de Pacientes, Otimização de Agenda e Automação via WhatsApp com IA.**

---

## 🧠 Solara AI: O Cérebro do Sistema

A **Solara AI** (alimentada por **Google Gemini**) atua como **Consultora de Gestão Odontológica de Elite** — não apenas um chatbot, mas um motor de decisão proativo.

### 🎯 Diretrizes Clínicas (Core Rules)
1. **Foco em Abandono de Tratamento:** Prioridade em detectar e reativar pacientes que abandonaram tratamentos em curso (canal, aparelho, implante, etc.).
2. **Recuperação Ativa:** Identificar janelas de retorno (ex: 6 meses pós-extração → indicar implante) e disparar campanhas automáticas.
3. **Autoridade Técnica Odontológica:** Conhecimento profundo em especialidades — Ortodontia, Implantodontia, Endodontia, Prótese, Periodontia, Dentística, Odontopediatria.
4. **Linguagem Executiva:** Comunicação direta, orientada ao CEO da clínica, com métricas e ROI.
5. **Proatividade IA:** Antecipar a próxima ação estratégica — sugerir campanhas, alertar riscos, recomendar procedimentos complementares.
6. **Metodologia SPIN:** Nas conversas via WhatsApp, seguir o funil SPIN (Situação → Problema → Implicação → Necessidade) para conversão de leads.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────┐
│           FRONTEND (Next.js 14)          │
│   Dashboard SaaS — solaraconnect.online  │
├─────────────────────────────────────────┤
│          BANCO DE DADOS (Supabase)       │
│  PostgreSQL + RLS Multi-Tenant + Auth    │
├─────────────────────────────────────────┤
│           IA (Google Gemini)             │
│   Flash (Chat) + Pro (Relatórios)        │
├─────────────────────────────────────────┤
│       WHATSAPP (Evolution API)           │
│   Instância: Ativo_Hub                   │
├─────────────────────────────────────────┤
│      MOTOR PYTHON (solara_ai_engine)     │
│   FastAPI para automações avançadas      │
└─────────────────────────────────────────┘
```

---

## 🧬 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Estilização** | TailwindCSS v4 + CSS Modules |
| **Banco de Dados** | Supabase (PostgreSQL + Auth + RLS) |
| **IA** | Google Gemini (Flash para chat, Pro para análise) |
| **WhatsApp** | Evolution API — instância `Ativo_Hub` |
| **Motor Python** | FastAPI (`solara_ai_engine/main.py`) |
| **Deploy** | EasyPanel + Docker |
| **Pagamentos** | PagBank (assinaturas SaaS) |

---

## 🗄️ Modelo de Dados (Supabase — Multi-Tenant)

> Cada clínica é um **tenant isolado** com Row Level Security (RLS) ativo.

### Tabelas Principais

| Tabela | Descrição |
|---|---|
| `clinics` | Tenant base — dados da clínica, CNPJ, endereço, instância Evolution |
| `plans` | Planos SaaS: 2 / 3-5 / 5-8 especialistas |
| `subscriptions` | Assinaturas (status: pending, active, cancelled, expired, overdue) |
| `specialists` | Especialistas por clínica (limitado pelo plano via trigger) |
| `patients` | Pacientes/Leads com temperatura (novo, morno, frio, perdido, convertido) |
| `appointments` | Agendamentos com status (pending, confirmed, cancelled, completed) |
| `ai_conversations` | Logs do agente SPIN por paciente (etapas: situacao, problema, implicacao, necessidade) |
| `knowledge_base` | Base de conhecimento odontológico para treinar a IA |
| `recovery_campaigns` | Campanhas de recuperação de pacientes inativos |

### Planos SaaS Disponíveis

| Plano | Especialistas | Preço/mês |
|---|---|---|
| Starter | Até 2 | R$ 147,00 |
| Pro | Até 5 | R$ 257,00 |
| Elite | Até 8 | R$ 367,00 |

---

## 📋 Módulos do Dashboard

### 1. 📊 Visão Geral (Overview)
- Alerta IA proativo (pacientes em risco de abandono)
- Stats: Taxa de Abandono, Convites Enviados, Pacientes Recuperados, Faturamento Recuperado
- Kanban de Agenda: Agendados / Confirmados / Em Espera

### 2. 📅 Agenda
- Visualização de consultas do dia/semana
- Tipos de procedimento: Canal, Aparelho, Implante, Avaliação, Manutenção, etc.
- Lembretes automáticos 2h antes via WhatsApp

### 3. 👥 Pacientes / Leads
- CRM odontológico com temperatura de lead
- Origens: WhatsApp, Site, Indicação, Campanha
- Histórico de consultas e conversas IA

### 4. 🔄 Recuperação de Pacientes
- Lista de pacientes inativos há > 6 meses
- Disparo de mensagem personalizada via Evolution API
- Acompanhamento de taxa de resposta e conversão

### 5. 📣 Campanhas
- Criação de campanhas segmentadas por especialidade
- Envio massivo via WhatsApp (Evolution API)
- Métricas de abertura e conversão

### 6. 👨‍⚕️ Especialistas
- Cadastro de dentistas por especialidade
- CRO (Registro Profissional)
- Limite controlado pelo plano ativo (trigger Supabase)

### 7. 💬 Conversas
- Inbox do WhatsApp integrado ao Evolution
- Agente SPIN ativo nas conversas
- Escalada automática para humano quando necessário

### 8. 💰 Financeiro
- KPIs financeiros da clínica
- Faturamento recuperado via campanhas
- Ticket médio por procedimento

### 9. 📈 Relatórios
- Análise de performance gerada pela Solara AI
- Insights estratégicos por período
- Exportação de dados

### 10. 🧠 Segundo Cérebro (Second Brain)
- Interface de chat com a Solara AI dentro do dashboard
- Análise de dados em linguagem natural
- Sugestões estratégicas em tempo real

---

## 📲 Integração Evolution API (WhatsApp)

**Instância:** `Ativo_Hub`

### Fluxos Ativos

| Fluxo | Descrição |
|---|---|
| **Lead Inbound** | WhatsApp → IA qualifica → Agenda ou transfere para humano |
| **Recuperação** | Paciente inativo detectado → Campanha automática personalizada |
| **Lembrete de Consulta** | 2h antes do agendamento → Mensagem automática |
| **Pós-Consulta** | 24h após → Solicitação de feedback + indicação de próximo retorno |

### Metodologia SPIN nos Chats
```
SITUAÇÃO   → "Há quanto tempo você está com essa dor de dente?"
PROBLEMA   → "Isso está afetando sua alimentação ou sono?"
IMPLICAÇÃO → "Se não tratar, pode virar canal ou extração..."
NECESSIDADE → "Posso te agendar uma avaliação ainda essa semana?"
```

---

## 🔐 Segurança & Autenticação

- **Auth:** Supabase Auth (email/senha + magic link)
- **Multi-tenant:** RLS ativo em todas as tabelas — cada clínica só acessa seus dados
- **Service Role:** Usado em webhooks e automações backend
- **API Key interna:** `AUTHENTICATION_API_KEY` para endpoints sensíveis

---

## 🚀 Deploy & Infraestrutura

| Item | Config |
|---|---|
| **Plataforma** | EasyPanel 2 |
| **Serviço** | `odonto-connect` |
| **Porta** | 3005 (dev local) / 3000 (produção container) |
| **Dockerfile** | Multi-stage: builder Node 20 + runner slim |
| **CI/CD** | Push para `main` → trigger automático EasyPanel |
| **Redis** | `redis://default:***@easypanel2_redis:6379` |

---

## 🛠️ Roadmap de Evolução

### Fase 1 — Estabilização (Atual)
- [x] Schema Supabase Multi-Tenant com RLS
- [x] Dashboard completo com todos os módulos
- [x] Integração Evolution API (WhatsApp)
- [x] Solara AI Chat no dashboard
- [x] Sistema de Campanhas de Recuperação
- [x] SEO: sitemap.xml + robots.ts
- [x] Deploy via EasyPanel + Dockerfile

### Fase 2 — Inteligência Avançada
- [ ] Análise preditiva de cancelamentos (ML)
- [ ] "Oportunidades de Ouro" no overview — cruzamento de histórico + janelas de retorno
- [ ] Linha do tempo unificada do paciente (consultas + conversas IA + pagamentos)
- [ ] Módulo de Cross-sell: sugerir procedimento complementar com base no histórico

### Fase 3 — Escala SaaS
- [ ] Onboarding guiado para novas clínicas (wizard)
- [ ] Portal de administração (super-admin para gerenciar todos os tenants)
- [ ] App mobile (React Native ou PWA)
- [ ] Integração com sistemas de prontuário (Dental Cremer, Clinicorp, etc.)
- [ ] Relatórios automáticos por e-mail (PDF semanal para a clínica)

---

## 🔑 Variáveis de Ambiente (.env.local)

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin (backend/webhooks) |
| `GEMINI_API_KEY` | Google Gemini (server-side only) |
| `EVOLUTION_API_KEY` | Autenticação Evolution API |
| `NEXT_PUBLIC_EVOLUTION_INSTANCE` | Nome da instância: `Ativo_Hub` |
| `AUTHENTICATION_API_KEY` | Proteção de endpoints internos |
| `PAGBANK_TOKEN` | Integração pagamentos |
| `REDIS_URL` | Cache e filas |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |

---

## 📂 Links Internos (Obsidian)

- [[Pacientes & CRM Odontológico]]
- [[Fluxos de Automação WhatsApp]]
- [[Campanhas de Recuperação]]
- [[Especialidades Odontológicas]]
- [[Metodologia SPIN Odonto]]
- [[Planos e Assinaturas SaaS]]
- [[Deploy EasyPanel]]
- [[Schema Supabase]]

---

*Documento mantido pela Solara AI — Atualizado automaticamente a cada sprint.*
*Versão: 2.0 | Projeto: Solara Connect Odonto | Status: Produção*
