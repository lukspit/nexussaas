import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { Activity, Users, MessageCircle, Settings, QrCode, Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Não autenticado.</div>
    }

    // 1. Puxar clínica associada ao usuário
    const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

    let status = 'Desconectada'
    let isConnected = false
    let patientsTodayCount = 0
    let upcomingAppointments: any[] = []
    let estimatedConversion = '0%'

    if (clinic) {
        // 2. Status da Z-API na tabela instances
        const { data: instance } = await supabase
            .from('instances')
            .select('status')
            .eq('clinic_id', clinic.id)
            .single()

        if (instance?.status === 'CONNECTED') {
            status = 'Online'
            isConnected = true
        }

        // 3. Pacientes Novos Hoje
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { count: newPatientsCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id)
            .gte('created_at', startOfDay.toISOString())

        patientsTodayCount = newPatientsCount || 0

        // 4. Agendamentos Hoje (criados hoje) - Usado para calcular a conversão diária
        const { count: appointmentsTodayCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id)
            .gte('created_at', startOfDay.toISOString())

        // 5. Conversão Estimada (agendamentos hoje / pacientes novos hoje)
        if (patientsTodayCount > 0 && appointmentsTodayCount !== null) {
            const conversionRate = Math.round((appointmentsTodayCount / patientsTodayCount) * 100)
            estimatedConversion = `${conversionRate}%`
        }

        // 6. Próximos Agendamentos (do momento atual para frente)
        const now = new Date()
        const { data: appointments } = await supabase
            .from('appointments')
            .select('id, scheduled_at, status, patients(name)')
            .eq('clinic_id', clinic.id)
            .gte('scheduled_at', now.toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5)

        upcomingAppointments = appointments || []
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Bem-vindo(a){clinic?.name ? `, ${clinic.name}` : ''}</h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Visão geral da sua inteligência artificial.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Novos Pacientes Hoje</CardTitle>
                        <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{patientsTodayCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leads iniciados no WhatsApp
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Conversão do Dia</CardTitle>
                        <Activity className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{estimatedConversion}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Agendamentos / Novos Leads
                        </p>
                    </CardContent>
                </Card>

                <Card className={`bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden transition-all duration-300 group ${isConnected ? 'hover:shadow-green-500/10' : 'hover:shadow-destructive/10'}`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-colors duration-500 ${isConnected ? 'bg-green-500/10' : 'bg-destructive/10'}`} />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status da IA</CardTitle>
                        <Activity className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-destructive'} group-hover:scale-110 transition-transform`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${isConnected ? 'text-green-500' : 'text-destructive'}`}>
                            {status}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isConnected ? 'Conectada na Z-API e operando.' : 'API offline.'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Próximos Agendamentos
                        </CardTitle>
                        <CardDescription>
                            Os últimos compromissos marcados pela IA na sua agenda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-56 overflow-y-auto pr-2">
                        {upcomingAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-80 mt-4 pb-4">
                                <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm">Nenhum agendamento futuro no momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAppointments.map((apt: any) => {
                                    const aptDate = new Date(apt.scheduled_at)
                                    const dateFormatted = aptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                    const timeFormatted = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                                    return (
                                        <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-muted/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{apt.patients?.name || 'Paciente sem nome'}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{apt.status === 'PENDING' ? 'Pendente' : apt.status}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-primary">{timeFormatted}</span>
                                                <span className="text-xs text-muted-foreground">{dateFormatted}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden flex flex-col">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-primary/10"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Ações Rápidas
                        </CardTitle>
                        <CardDescription>Atalhos úteis para o dia a dia.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 justify-center space-y-3">
                        <Link href="/dashboard/whatsapp" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <QrCode className="mr-3 h-5 w-5 text-primary" />
                                <span className="relative z-10 font-medium tracking-wide">Conexão Z-API</span>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary relative z-10" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/conversations" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <MessageCircle className="mr-3 h-5 w-5 text-blue-500" />
                                <span className="relative z-10 font-medium tracking-wide">Central de Conversas</span>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500 relative z-10" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/settings" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <Settings className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <span className="relative z-10 font-medium tracking-wide">Configurações Base</span>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-500 dark:text-gray-400 relative z-10" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
