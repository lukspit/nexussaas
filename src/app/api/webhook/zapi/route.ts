import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';

// Cliente Supabase com permissões básicas (Anon Key)
// O RPC 'get_webhook_context' foi criado como SECURITY DEFINER no banco para contornar o RLS de forma isolada e segura.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Conexão com a inteligência usando OpenRouter para garantir flexibilidade de modelos
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const logContent = `\n[${new Date().toISOString()}] WEBHOOK RECEBIDO:\n${JSON.stringify(body, null, 2)}\n`;
        fs.appendFileSync('/tmp/nexus_zapi_debug.log', logContent);

        console.log('\n\n🚨 [DEBUG] WEBHOOK BATEU NO NEXT! Payload Z-API:', JSON.stringify(body, null, 2));

        // Regra: Ignorar mensagens enviadas por nós mesmos ou mensagens de grupos
        if (body.fromMe || body.isGroup) {
            console.log('⚠️ Ignorando (Mensagem enviada por mim ou grupo)');
            return NextResponse.json({ status: 'ignored' });
        }

        const instanceId = body.instanceId;
        const phone = body.phone;
        const userMessage = body.text?.message;

        if (!instanceId || !phone || !userMessage) {
            return NextResponse.json({ error: 'Missing payload data' }, { status: 400 });
        }

        // 1. Busca o Contexto da Clínica e Tokens cruzando Z-API ID com nosso Banco
        const { data: contextData, error: contextError } = await supabase
            .rpc('get_webhook_context', { p_zapi_instance_id: instanceId })
            .single() as {
                data: {
                    instance_uuid: string;
                    zapi_token: string;
                    client_token: string | null;
                    clinic_name: string;
                    clinic_rules: string;
                    clinic_specialties: string;
                    consultation_fee: number;
                } | null;
                error: any;
            };

        if (contextError || !contextData) {
            console.error('Error fetching context:', contextError);
            return NextResponse.json({ error: 'Instance or Clinic not found in our Database' }, { status: 404 });
        }

        const fetchHeaders: any = { 'Content-Type': 'application/json' };
        if (contextData.client_token) {
            fetchHeaders['Client-Token'] = contextData.client_token;
        }

        // ==========================================
        // HUMANIZAÇÃO - ESTÁGIO 1 & 2 (Pausa e Visto Azul)
        // ==========================================
        // Delay proposital de 1.5s simulando humano "abrindo o Whatsapp"
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (body.messageId) {
            try {
                const readUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/read-message`;
                await fetch(readUrl, {
                    method: 'POST',
                    headers: fetchHeaders,
                    body: JSON.stringify({
                        phone: phone,
                        messageId: body.messageId
                    })
                });
            } catch (e) {
                console.error('Ops, falha ao tentar dar os Blue Ticks na Z-API:', e);
            }
        }
        // ==========================================

        // 2. Resgata a Memória (Histórico) das últimas 10 mensagens desse paciente
        const { data: history } = await supabase
            .from('messages')
            .select('role, content')
            .eq('instance_id', contextData.instance_uuid)
            .eq('phone_number', phone)
            .order('created_at', { ascending: false })
            .limit(10);

        const recentMessages = (history || []).reverse().map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        }));

        // 3. Salva a nova mensagem recebida no banco para histórico
        await supabase.from('messages').insert({
            instance_id: contextData.instance_uuid,
            phone_number: phone,
            role: 'user',
            content: userMessage,
        });

        // 4. Constrói o Cérebro (System Prompt) injetando o contexto dinâmico da clínica
        const systemPrompt = `Você é a IA assistente da clínica: ${contextData.clinic_name}.
Especialidades: ${contextData.clinic_specialties}
Valor da Consulta: R$ ${contextData.consultation_fee}

REGRAS DE ATENDIMENTO E CONTEXTO:
${contextData.clinic_rules}

Diretrizes obrigatórias:
- Seja extremamente educado, empático e humano. Jamais pareça um robô engessado.
- Use emojis moderadamente para manter o tom amigável.
- Responda EXCLUSIVAMENTE com base nas "Regras de Atendimento". Se o paciente perguntar algo não coberto nas regras, diga educadamente que você não possui essa informação no momento e que transferirá num instante para a secretária humana.
- Seja objetivo e conciso (como uma conversa real fluída de WhatsApp, evite textões dividindo a atenção).`;

        // 5. Chamada de Inferência (LLM via OpenRouter -> gpt-4o-mini definido pelo user)
        const completion = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
                { role: 'system', content: systemPrompt },
                ...recentMessages,
                { role: 'user', content: userMessage }
            ],
        });

        const aiResponse = completion.choices[0].message.content || '...';

        // 6. Salva a Resposta da IA no Memória (Banco)
        if (aiResponse !== '...') {
            await supabase.from('messages').insert({
                instance_id: contextData.instance_uuid,
                phone_number: phone,
                role: 'assistant',
                content: aiResponse,
            });
        }

        // 7. Envia a Resposta Final de volta para o Aparelho correto na Z-API
        const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-text`;

        // Calcula o delay de digitação dinâmico (mínimo 2s, máximo 15s, média de 1s para cada 15 caracteres)
        const typingDelay = Math.max(2, Math.min(15, Math.ceil(aiResponse.length / 15)));

        const zapiReq = await fetch(zapiUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({
                phone: phone,
                message: aiResponse,
                delayTyping: typingDelay
            })
        });

        if (!zapiReq.ok) {
            console.error('Falha ao despachar na Z-API:', await zapiReq.text());
        }

        return NextResponse.json({ success: true, ai_response_length: aiResponse.length });

    } catch (error) {
        console.error('Webhook Mestre - Falha Crítica:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
