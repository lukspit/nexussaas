# Nexus SaaS - Constituição do Projeto

## Contexto do Pivot
O Nexus está pivotando de um modelo de agência (High-Ticket) focado em automação de WhatsApp com uma stack fragmentada (Z-API + Chatwoot + n8n) para um modelo **Info-SaaS B2B "Self-Service"**. O cliente (médico/clínica) entra, paga, assina o SaaS, escaneia um QR Code e a IA começa a atender seus pacientes, tudo com zero intervenção manual da nossa equipe.

## A Nova Arquitetura
Abandono completo de n8n e Chatwoot. O Cérebro da aplicação será 100% código proprietário construído internamente.

### Tech Stack
- **Framework Full-stack:** Next.js (TypeScript, React, App Router, Tailwind CSS) integrando Front-end e Back-end.
- **Banco de Dados & Autenticação:** Supabase.
- **Integração WhatsApp:** Z-API (via um Webhook centralizado).
- **Motor de IA:** OpenAI API (GPT-4o / GPT-4o-mini).

## Data Schemas Iniciais (Tabelas Principais no Supabase)
1. **Users**
   - Tabela nativa do Supabase Auth (`auth.users`).
   - Gerencia credenciais e logins.

2. **Clinics**
   - `id`: UUID (Primary Key)
   - `name`: String (Nome da clínica/médico)
   - `specialties`: Text (Especialidades atendidas)
   - `rules`: Text (Regras de atendimento, horários, etc.)
   - `consultation_fee`: Decimal (Valor da consulta)
   - `owner_id`: UUID (Foreign Key para `Users`)

3. **Instances**
   - `id`: UUID (Primary Key)
   - `zapi_instance_id`: String (ID da instância na Z-API)
   - `zapi_token`: String (Token de segurança da Z-API)
   - `status`: String (Status da conexão, ex: CONNECTED, DISCONNECTED)
   - `clinic_id`: UUID (Foreign Key para `Clinics`)

## Fluxo Principal e Regras Arquitetônicas
- **Painel do Cliente:** Interface web autenticada via Supabase para preencher dados de contexto e regras da clínica.
- **Conexão Dinâmica:** No painel, o cliente solicita "Conectar", o sistema Next.js consome a API da Z-API para provisionar uma nova instância e retorna o QR Code para leitura na tela.
- **Webhook Centralizado (O Cérebro):**
  - Haverá **apenas um endpoint** no backend (Next.js Route Handler) designado para receber TODOS os webhooks (eventos) da Z-API de todos os clientes.
  - **A Lógica:**
    1. O endpoint recebe a mensagem e identifica qual é a `instance_id`.
    2. Consulta a tabela `Instances` e `Clinics` no Supabase para buscar as configurações e o conhecimento daquela clínica.
    3. Constrói o prompt de contexto enviando para a OpenAI gerar a resposta ideal.
    4. Responde para o paciente correto através da mesma instância originadora na Z-API.
