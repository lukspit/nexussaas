import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { WhatsAppManager } from './components/WhatsAppManager'

export default async function WhatsAppConnectionPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Buscar a clínica vinculada
    const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    // Buscar possível instância dessa clínica
    let isConnected = false
    let instanceInfo = undefined

    if (clinic) {
        const { data: instance } = await supabase
            .from('instances')
            .select('id, zapi_instance_id')
            .eq('clinic_id', clinic.id)
            .single()

        if (instance) {
            isConnected = true
            instanceInfo = {
                id: instance.id,
                zapi_instance_id: instance.zapi_instance_id || 'Desconhecido'
            }
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Conexão WhatsApp</h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Vincule seu número para que a inteligência artificial comece a operar.
                </p>
            </div>

            <WhatsAppManager initialIsConnected={isConnected} instanceInfo={instanceInfo} />
        </div>
    )
}
