'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, MessageSquare, LogOut, MessageCircle } from 'lucide-react'

interface DashboardSidebarProps {
    email?: string;
}

export function DashboardSidebar({ email }: DashboardSidebarProps) {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true
        },
        {
            name: 'Conversas',
            href: '/dashboard/conversations',
            icon: MessageCircle,
            exact: false
        },
        {
            name: 'Conexão WhatsApp',
            href: '/dashboard/whatsapp',
            icon: MessageSquare,
            exact: false
        },
        {
            name: 'Minha Clínica',
            href: '/dashboard/settings',
            icon: Settings,
            exact: false
        }
    ]

    return (
        <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-md hidden md:flex flex-col">
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                    Nexus SaaS
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${isActive
                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(124,127,242,0.15)]'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border/40">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/20">
                    <div className="text-sm truncate pr-2 text-muted-foreground">
                        {email}
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
    )
}
