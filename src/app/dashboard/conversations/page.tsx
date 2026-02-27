import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ConversationsList } from './ConversationsList'

export default async function ConversationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Buscar clínicas do usuário logado
    const { data: clinics } = await supabase.from('clinics').select('id').eq('owner_id', user.id)

    // Buscar as instâncias vinculadas a essas clínicas
    let instanceIds: string[] = []
    if (clinics && clinics.length > 0) {
        const clinicIds = clinics.map(c => c.id)
        const { data: instances } = await supabase.from('instances').select('id, zapi_instance_id').in('clinic_id', clinicIds)
        if (instances) {
            instanceIds = instances.map(i => i.id)
        }
    }

    // Buscar histórico de mensagens nas instâncias
    let allMessages = []
    if (instanceIds.length > 0) {
        const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .in('instance_id', instanceIds)
            .order('created_at', { ascending: false })
            .limit(1000)

        allMessages = msgs || []
    }

    // Agrupar mensagens por Número de Telefone em Memória
    const leadsMap = new Map()
    for (const msg of allMessages) {
        if (!leadsMap.has(msg.phone_number)) {
            leadsMap.set(msg.phone_number, {
                phoneNumber: msg.phone_number,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                messages: []
            })
        }
        leadsMap.get(msg.phone_number).messages.push(msg)
    }

    // Reordenar do mais antigo pro mais novo dentro de cada conversa
    for (const lead of leadsMap.values()) {
        lead.messages.reverse()
    }

    const leads = Array.from(leadsMap.values())

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Histórico de Conversas</h1>
                <p className="text-muted-foreground mt-2">Acompanhe e analise os atendimentos e vendas realizadas pela IA da sua clínica.</p>
            </div>

            <ConversationsList leads={leads} />
        </div>
    )
}
