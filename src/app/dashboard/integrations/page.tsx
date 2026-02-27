import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleConnectButton } from './components/GoogleConnectButton'
import { CalendarDays } from 'lucide-react'

export default async function IntegrationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Buscar a clínica vinculada
    const { data: clinic } = await supabase
        .from('clinics')
        .select('google_refresh_token, google_access_token')
        .eq('owner_id', user.id)
        .single()

    // O médico está com a conexão habilitada se a tabela clinic já capturou o Refresh Token.
    const isGoogleConnected = !!(clinic?.google_refresh_token || clinic?.google_access_token);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Cérebro e Integrações</h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Dê super poderes à inteligência artificial médica pareando seus aplicativos principais.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#4285F4]/10 rounded-full blur-3xl pointer-events-none" />

                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-6 h-6 text-[#4285F4]" />
                            Google Calendar
                        </CardTitle>
                        <CardDescription>
                            A mágica dos agendamentos autônomos. Permite que a IA médica faça consultas em tempo real da disponibilidade e adicione os eventos de marcação na hora para seus pacientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground bg-black/20 p-4 rounded-lg border border-white/5 space-y-2">
                            <p><strong>Permissão Necessária:</strong> Consulta e Agendamento de Eventos</p>
                            <p><strong>O que nosso Cérebro fará:</strong> Analisará as lacunas vazias do seu calendário para sugerir horários ativamente no WhatsApp e preencherá novos slots com os nomes dos interessados.</p>
                        </div>

                        <GoogleConnectButton isConnected={isGoogleConnected} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
