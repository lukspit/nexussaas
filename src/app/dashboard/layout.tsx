import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { LayoutDashboard, Settings, MessageSquare, LogOut } from 'lucide-react'

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
            {/* Sidebar */}
            <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-md hidden md:flex flex-col">
                <div className="p-6">
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        Nexus SaaS
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary text-secondary-foreground font-medium transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/whatsapp" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare className="w-5 h-5" />
                        Conexão WhatsApp
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                        <Settings className="w-5 h-5" />
                        Minha Clínica
                    </Link>
                </nav>

                <div className="p-4 border-t border-border/40">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/20">
                        <div className="text-sm truncate pr-2 text-muted-foreground">
                            {user.email}
                        </div>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                            <LogOut className="w-4 h-4" />
                            Sair
                        </button>
                    </form>
                </div>
            </aside>

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
