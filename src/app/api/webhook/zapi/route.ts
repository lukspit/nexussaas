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

// --- FUNÇÕES DE CHUNKING (N8N Legacy convertidas para TS) ---
const TAMANHO_IDEAL = 250;
const TAMANHO_MAX = 400;
const HARD_LIMIT = 800;

function protegerURLs(texto: string) {
    return texto.replace(/(https?:\/\/[^\s]+)/g, (url) => url.replace(/\./g, '___PONTO_URL___'));
}
function restaurarURLs(texto: string) {
    return texto.replace(/___PONTO_URL___/g, '.');
}

function protegerAbreviacoes(texto: string) {
    const abreviacoes = ['Dr.', 'Dra.', 'Sr.', 'Sra.', 'Jr.', 'Prof.', 'Profa.', 'etc.', 'ex.', 'obs.', 'pág.', 'tel.', 'cel.', 'min.', 'máx.', 'aprox.', 'nº.'];
    let resultado = texto;
    abreviacoes.forEach(abrev => {
        const regex = new RegExp(abrev.replace('.', '\\.'), 'gi');
        resultado = resultado.replace(regex, abrev.replace('.', '___PONTO___'));
    });
    return resultado;
}
function restaurarAbreviacoes(texto: string) {
    return texto.replace(/___PONTO___/g, '.');
}

function protegerListasNumeradas(texto: string) {
    return texto.replace(/(\d+)\.\s/g, '$1___PONTO___ ');
}

function encontrarPontoDeCorte(texto: string, limiteMinimo: number) {
    const pontosFrase = /[.!?](\s*(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;
    let melhorCorte = -1;
    let match;
    while ((match = pontosFrase.exec(texto)) !== null) {
        const fimDoMatch = match.index + match[0].length;
        if (fimDoMatch >= limiteMinimo) {
            melhorCorte = fimDoMatch;
            if (fimDoMatch >= TAMANHO_IDEAL) break;
        }
    }
    return melhorCorte;
}

function chunkMessage(mensagem: string): string[] {
    if (!mensagem || mensagem.trim().length === 0) return [];

    let texto = protegerURLs(mensagem);
    texto = protegerAbreviacoes(texto);
    texto = protegerListasNumeradas(texto);

    const linhas = texto.split(/\n/).filter(l => l.trim().length > 0);
    const textoUnificado = linhas.join('\n');

    const partes: string[] = [];
    let restante = textoUnificado;

    while (restante.trim().length > 0) {
        if (restante.length <= TAMANHO_MAX) {
            partes.push(restante.trim());
            break;
        }
        const janela = restante.substring(0, TAMANHO_MAX);
        let corte = encontrarPontoDeCorte(janela, 120);
        if (corte > 0) {
            partes.push(restante.substring(0, corte).trim());
            restante = restante.substring(corte).trim();
        } else {
            const janelaExpandida = restante.substring(0, HARD_LIMIT);
            corte = encontrarPontoDeCorte(janelaExpandida, 120);
            if (corte > 0) {
                partes.push(restante.substring(0, corte).trim());
                restante = restante.substring(corte).trim();
            } else {
                let corteEmergencia = janela.lastIndexOf('\n');
                if (corteEmergencia <= 120) corteEmergencia = janela.lastIndexOf(' ');
                if (corteEmergencia <= 120) corteEmergencia = TAMANHO_MAX;
                partes.push(restante.substring(0, corteEmergencia).trim());
                restante = restante.substring(corteEmergencia).trim();
            }
        }
    }
    return partes.map(parte => restaurarURLs(restaurarAbreviacoes(parte.trim())));
}
// -------------------------------------------------------------

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

        // 7. Envia a Resposta Final de volta para o Aparelho correto na Z-API (Streaming Fake em Chunks)
        const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-text`;

        const chunks = chunkMessage(aiResponse);
        let accumulatedDelayMessage = 0; // O primeiro pedaço vai instantaneamente (após os cálculos da Vercel)

        const dispatchPromises = chunks.map((chunk, index) => {
            // Calcula math randomico ou formula exata de envio (ex: 1s a cada 15 char, limit. 15)
            const typingDelay = Math.max(2, Math.min(15, Math.ceil(chunk.length / 15)));
            const payload = {
                phone: phone,
                message: chunk,
                delayMessage: accumulatedDelayMessage, // Acumula de quando começar a PENSAR pra essa msg (evita encavalar)
                delayTyping: typingDelay                // Fica "digitando" depois que der o tempo de atraso
            };

            // Para que o próximo balão só comece a piscar "digitando..." APÓS ESTE balão atual ser ENVIADO de fato
            // Atraso Próximo Balão = Tempo da fila dele + O tempo em que digitou o anterior + 1 segundo (Respiro humano extra)
            accumulatedDelayMessage += (typingDelay + 1);

            return fetch(zapiUrl, {
                method: 'POST',
                headers: fetchHeaders,
                body: JSON.stringify(payload)
            }).then(async (res) => {
                if (!res.ok) console.error(`[ZAPI Chunk ${index}] Erro:`, await res.text());
            }).catch(err => console.error(`[ZAPI Chunk ${index}] Rede Error:`, err));
        });

        // Aguarda todas as requisições paralelas sumirem para a ZAPI mas NUNCA encavala o processo serverless (Serverless Vercel resolve na hora)
        await Promise.all(dispatchPromises);

        return NextResponse.json({ success: true, ai_response_length: aiResponse.length });

    } catch (error) {
        console.error('Webhook Mestre - Falha Crítica:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
