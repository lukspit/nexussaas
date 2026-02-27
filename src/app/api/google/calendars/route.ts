import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar as credenciais do Google salvas na clínica do médico
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .select('google_access_token, google_refresh_token, google_calendar_id')
            .eq('owner_id', user.id)
            .single();

        if (clinicError || !clinic || !clinic.google_refresh_token) {
            return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
        }

        // Configurar o cliente OAuth2 do Google
        // Mesmo sem o ClientID aqui embaixo configurado perfeitamente na lib, o simple uso do access_token garante a chamada da rest API.
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: clinic.google_access_token,
            refresh_token: clinic.google_refresh_token,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Buscar a lista de agendas
        const response = await calendar.calendarList.list({
            minAccessRole: 'writer', // Só traz agendas que o usuário tem permissão para escrever eventos
        });

        const calendars = response.data.items?.map(cal => ({
            id: cal.id,
            summary: cal.summary,
            primary: cal.primary,
            color: cal.backgroundColor
        })) || [];

        return NextResponse.json({
            calendars,
            activeCalendarId: clinic.google_calendar_id // Agenda salva anteriormente, se houver
        });

    } catch (error: any) {
        console.error('Error fetching google calendars:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { calendarId } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !calendarId) {
            return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
        }

        const { error } = await supabase
            .from('clinics')
            .update({ google_calendar_id: calendarId })
            .eq('owner_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving active calendar:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
