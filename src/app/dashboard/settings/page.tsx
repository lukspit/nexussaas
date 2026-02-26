import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch existing clinic data
    const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

    async function saveClinicData(formData: FormData) {
        'use server'
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const data = {
            name: formData.get('name') as string,
            specialties: formData.get('specialties') as string,
            consultation_fee: parseFloat(formData.get('fee') as string) || 0,
            rules: formData.get('rules') as string,
            owner_id: user.id
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('clinics')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (existing) {
            await supabase.from('clinics').update(data).eq('id', existing.id)
        } else {
            await supabase.from('clinics').insert(data)
        }

        revalidatePath('/dashboard/settings')
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Minha Clínica</h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Configure o contexto e as regras que a inteligência artificial deve seguir.
                </p>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg max-w-3xl">
                <CardHeader>
                    <CardTitle>Dados de Atendimento</CardTitle>
                    <CardDescription>
                        Essas informações instruem nossa IA sobre como interagir com seus pacientes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={saveClinicData} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome da Clínica ou Doutor</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={clinic?.name || ''}
                                    placeholder="Ex: Clínica Nexus ou Dr. Lucas"
                                    required
                                    className="bg-background/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="specialties">Especialidade Principal</Label>
                                    <Input
                                        id="specialties"
                                        name="specialties"
                                        defaultValue={clinic?.specialties || ''}
                                        placeholder="Ex: Dermatologia Estética"
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="fee">Valor da Consulta (R$)</Label>
                                    <Input
                                        id="fee"
                                        name="fee"
                                        type="number"
                                        step="0.01"
                                        defaultValue={clinic?.consultation_fee || ''}
                                        placeholder="Ex: 250.00"
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="rules">Regras de Atendimento e Ton de Voz</Label>
                                <textarea
                                    id="rules"
                                    name="rules"
                                    rows={5}
                                    defaultValue={clinic?.rules || ''}
                                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Ex: Somos uma clínica premium. Atendemos apenas particular. Horário de funcionamento: Seg a Sex das 09h às 18h..."
                                ></textarea>
                                <p className="text-xs text-muted-foreground">
                                    Descreva detalhadamente. Isso fará o cérebro da Z-API agir de forma muito mais inteligente.
                                </p>
                            </div>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto">
                            Salvar Configurações
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
