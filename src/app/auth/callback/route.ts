import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        // Se logou com sucesso e retornou um provider_refresh_token (Google)
        if (data?.session && data.session.provider_refresh_token) {
            // Salva na clínica
            await supabase.from('clinics').update({
                google_refresh_token: data.session.provider_refresh_token,
                google_access_token: data.session.provider_token
            }).eq('owner_id', data.session.user.id)
        } else if (data?.session && data.session.provider_token) {
            // As vezes o Google só retorna access_token dependendo do Access_Type
            await supabase.from('clinics').update({
                google_access_token: data.session.provider_token
            }).eq('owner_id', data.session.user.id)
        }
    }

    // Redireciona de volta para o Dashboard > Integrações
    return NextResponse.redirect(`${requestUrl.origin}/dashboard/integrations`)
}
