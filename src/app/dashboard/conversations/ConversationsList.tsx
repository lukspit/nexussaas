'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { MessageSquare, Phone, Clock, User, X, MessageCircle } from 'lucide-react'

export interface Message {
    id?: string;
    instance_id: string;
    phone_number: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface Lead {
    phoneNumber: string;
    lastMessage: string;
    lastMessageTime: string;
    messages: Message[];
}

export function ConversationsList({ leads }: { leads: Lead[] }) {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    if (leads.length === 0) {
        return (
            <Card className="p-8 text-center bg-card/30 backdrop-blur-md border border-white/10 mt-6 shadow-[0_0_30px_rgba(124,127,242,0.1)]">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-white">Nenhuma conversa encontrada</h3>
                <p className="text-muted-foreground mt-2">Assim que a IA começar a atender, os leads aparecerão aqui.</p>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
            {/* Leads List */}
            <div className="md:col-span-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {leads.map(lead => (
                    <Card
                        key={lead.phoneNumber}
                        className={`p-4 cursor-pointer transition-all hover:translate-x-1 hover:shadow-[0_0_20px_rgba(124,127,242,0.2)] border-white/5 bg-card/50 backdrop-blur-md ${selectedLead?.phoneNumber === lead.phoneNumber ? 'ring-1 ring-primary bg-primary/10 shadow-[0_0_20px_rgba(124,127,242,0.2)]' : ''}`}
                        onClick={() => setSelectedLead(lead)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white tracking-wide truncate">{lead.phoneNumber}</h4>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {new Date(lead.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate line-clamp-2 leading-relaxed">
                            {lead.lastMessage}
                        </p>
                    </Card>
                ))}
            </div>

            {/* Simulated WhatsApp Interface */}
            <div className="md:col-span-2 h-full">
                {selectedLead ? (
                    <Card className="flex flex-col h-full bg-[#0b141a] border-white/10 shadow-2xl relative overflow-hidden rounded-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-[#202c33] border-b border-white/5 shadow-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#e9edef] tracking-wide">{selectedLead.phoneNumber}</h4>
                                    <p className="text-xs text-[#8696a0]">Paciente ativo</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="text-[#8696a0] hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Background Map Pattern (subtle WhatsApp vibe) */}
                        <div className="absolute inset-0 top-[73px] z-0 opacity-5" style={{ backgroundImage: "url('https://static.whatsapp.net/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')", backgroundRepeat: 'repeat' }}></div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 flex flex-col custom-scrollbar">
                            <div className="text-center my-4">
                                <span className="px-3 py-1 bg-[#202c33] text-[#8696a0] text-xs rounded-lg uppercase tracking-wider font-semibold shadow-sm">
                                    Início da Conversa Ativa
                                </span>
                            </div>

                            {selectedLead.messages.map(msg => {
                                const isUser = msg.role === 'user'
                                return (
                                    <div key={msg.id || msg.created_at + Math.random()} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] rounded-lg p-3 relative shadow-md ${isUser ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-white/5' : 'bg-[#005c4b] text-[#e9edef] rounded-tr-none border border-[#005c4b]'}`}>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <div className="flex justify-end gap-1 mt-1.5 opacity-80">
                                                <span className="text-[10px] text-[#8696a0]">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center h-full bg-card/20 backdrop-blur-md border-white/5 border-dashed">
                        <MessageCircle className="w-16 h-16 text-primary/40 mb-4 animate-pulse" />
                        <h4 className="text-xl font-semibold text-white">Nenhum Lead Selecionado</h4>
                        <p className="text-sm text-muted-foreground mt-2 text-center max-w-[250px]">Clique em um chate à esquerda para visualizar todo o histórico da conversa entre o cliente e a IA Médica.</p>
                    </Card>
                )}
            </div>
        </div>
    )
}
