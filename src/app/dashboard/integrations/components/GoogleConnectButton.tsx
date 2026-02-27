'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react'

export function GoogleConnectButton({ isConnected }: { isConnected: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleConnect = async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar.events',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                },
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            console.error('Erro ao conectar com Google', error)
            setIsLoading(false)
        }
    }

    if (isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-6 border border-green-500/30 bg-green-500/5 rounded-xl space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <div className="text-center">
                    <h3 className="font-semibold text-green-400">Google Calendar Conectado!</h3>
                    <p className="text-sm text-green-500/80">A inteligência artificial já tem acesso de leitura e escrita para agendar suas consultas.</p>
                </div>
            </div>
        )
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#4285F4] hover:bg-[#3367D6] text-white flex gap-2 items-center"
        >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
            Autorizar Acesso ao Google Calendar
        </Button>
    )
}
