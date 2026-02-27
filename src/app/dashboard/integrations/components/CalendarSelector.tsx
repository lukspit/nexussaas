'use client';

import { useEffect, useState } from 'react';
import { Loader2, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CalendarItem = {
    id: string;
    summary: string;
    primary: boolean;
    color: string;
};

export function CalendarSelector() {
    const [calendars, setCalendars] = useState<CalendarItem[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [initialId, setInitialId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        try {
            const res = await fetch('/api/google/calendars');
            if (!res.ok) throw new Error('Falha ao buscar agendas');

            const data = await res.json();
            setCalendars(data.calendars);

            if (data.activeCalendarId) {
                setSelectedId(data.activeCalendarId);
                setInitialId(data.activeCalendarId);
            } else {
                // Seleciona a agenda primária por padrão se não houver nenhuma salva
                const primary = data.calendars.find((c: CalendarItem) => c.primary);
                if (primary) setSelectedId(primary.id);
            }
        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar suas agendas do Google.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedId) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/google/calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calendarId: selectedId })
            });

            if (!res.ok) throw new Error('Erro ao salvar agenda principal');

            setInitialId(selectedId);
        } catch (err) {
            console.error(err);
            alert('Falha ao salvar a agenda selecionada.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4 text-purple-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Buscando suas agendas...</span>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-sm text-red-400 text-center">{error}</div>;
    }

    if (calendars.length === 0) {
        return <div className="p-4 text-sm text-yellow-500 text-center">Nenhuma agenda encontrada na sua conta.</div>;
    }

    const hasChanged = selectedId !== initialId;

    return (
        <div className="mt-4 p-4 border border-purple-500/20 bg-purple-500/5 rounded-lg space-y-4">
            <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-purple-300">
                    <CalendarIcon className="w-4 h-4" />
                    Qual agenda a IA deve gerenciar?
                </h4>
                <p className="text-xs text-purple-400/70 mt-1">
                    Eventos serão agendados e lidos isoladamente desta agenda.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="w-full sm:w-[300px] border-purple-500/30 bg-black/40 text-purple-200">
                        <SelectValue placeholder="Selecione uma agenda" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#110C1B] border-purple-500/30 text-purple-200">
                        {calendars.map((cal) => (
                            <SelectItem key={cal.id} value={cal.id} className="focus:bg-purple-500/20 focus:text-purple-100">
                                {cal.summary} {cal.primary && '(Principal)'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={handleSave}
                    disabled={!hasChanged || isSaving}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar
                </Button>
            </div>
            {!hasChanged && initialId && (
                <p className="text-xs text-green-400/80">Agenda ativa e salva no sistema.</p>
            )}
        </div>
    );
}
