import OpenAI from 'openai';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

async function runTest() {
    const messages: any[] = [
        { role: 'system', content: 'Você tem a ferramenta check_availability e book_appointment. Se o usuário pedir para agendar amanhã às 14h, VOCÊ DEVE CHAMAR A FERRAMENTA book_appointment com as datas formatadas em ISO.' },
        { role: 'user', content: 'Quero agendar para amanhã, segunda-feira, às 14h da tarde. Meu nome é Lucas.' }
    ];

    const tools: any = [
        {
            type: 'function',
            function: {
                name: 'book_appointment',
                description: 'Marca uma consulta médica preenchendo o slot no Google Calendar e nossa base.',
                parameters: {
                    type: 'object',
                    properties: {
                        patient_name: { type: 'string', description: 'Nome completo do paciente' },
                        start_time: { type: 'string', description: 'Hora de início (ISO 8601, ex: 2024-05-20T14:00:00-03:00)' },
                        end_time: { type: 'string', description: 'Hora de término (ISO 8601, normalmente 1 hora após o check_in)' }
                    },
                    required: ['patient_name', 'start_time', 'end_time']
                }
            }
        }
    ];

    console.log("Sending to OpenRouter...");
    const payload: any = {
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        tools: tools,
        tool_choice: 'auto'
    };

    try {
        const completion = await openai.chat.completions.create(payload);
        const aiMessage = completion.choices[0].message;

        console.log("Response:", JSON.stringify(aiMessage, null, 2));

        if (aiMessage.tool_calls) {
            console.log("\nTOOL CALLED!");
            const toolCall = aiMessage.tool_calls[0] as any;
            const funcArgs = JSON.parse(toolCall.function.arguments);

            // Simular chamada do Google API
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({
                access_token: process.env.GOOGLE_ACCESS_TOKEN || "SEU_TOKEN_AQUI",
                // Refresh token omitido - O access_token expira em 1 hora.
            });
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            try {
                const timeMin = new Date(`${funcArgs.date}T00:00:00-03:00`).toISOString();
                const timeMax = new Date(`${funcArgs.date}T23:59:59-03:00`).toISOString();
                console.log(`Checking Google Calendar for: ${timeMin} to ${timeMax}`);
                const events = await calendar.events.list({
                    calendarId: "05a7c814877f0422fdefbc47b78ac14e484f1362f3ae0be2fdc2af5359e1fd56@group.calendar.google.com",
                    timeMin, timeMax,
                    singleEvents: true,
                    orderBy: 'startTime',
                });

                const busySlots = events.data.items?.map((e: any) => ({
                    start: e.start?.dateTime || e.start?.date,
                    end: e.end?.dateTime || e.end?.date,
                    summary: 'Ocupado'
                })) || [];

                console.log("Busy Slots:", JSON.stringify(busySlots, null, 2));

            } catch (err: any) {
                console.log("Google API Error:", err.message);
            }
        }
    } catch (e: any) {
        console.log("Error OpenRouter:", e.message);
    }
}

runTest();
