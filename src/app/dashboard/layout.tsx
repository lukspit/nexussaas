import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardSidebar } from '@/components/DashboardSidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar (Client Component com Active State Tracking) */}
            <DashboardSidebar email={user.email} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <header className="h-16 border-b border-border/40 flex items-center px-6 md:hidden">
                    <h2 className="text-xl font-bold tracking-tight">Nexus SaaS</h2>
                </header>
                <div className="p-8 max-w-6xl mx-auto w-full flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}
