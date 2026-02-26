import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { Activity, Users, MessageCircle } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch clinic statistics later, mocked for now to look premium
    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Bem-vindo(a)</h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Visão geral da sua inteligência artificial.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
                        <MessageCircle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +4 desde a última hora
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversão Estimada</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">85%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Taxa de agendamentos concluídos
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status da IA</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">Online</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Conectada na Z-API e operando.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader>
                        <CardTitle>Últimas Conversas</CardTitle>
                        <CardDescription>
                            A inteligência artificial fez 3 agendamentos hoje.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                        Gráfico ou Lista entrará aqui...
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                        <CardDescription>Atalhos úteis para o dia a dia.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex flex-col items-center justify-center h-48">
                        <div className="text-center text-muted-foreground text-sm">
                            Configurações da clínica e QR Code do WhatsApp em breve.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
