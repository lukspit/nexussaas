'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Smartphone, QrCode, Wifi, AlertTriangle } from 'lucide-react'

export function WhatsAppManager({ initialIsConnected, instanceInfo }: { initialIsConnected: boolean, instanceInfo?: { id: string, zapi_instance_id: string } }) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [showQR, setShowQR] = useState(false)

    // Simulando delay da Z-API para futuro MVP
    const handleGenerateQR = () => {
        setIsGenerating(true)
        setTimeout(() => {
            setIsGenerating(false)
            setShowQR(true)
        }, 2000)
    }

    const handleSimulateConnected = () => {
        setShowQR(false)
        setIsConnected(true)
    }

    const handleDisconnect = () => {
        setIsConnected(false)
        setShowQR(false)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">

            {/* Card de Status */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        Sua Instância (Z-API)
                    </CardTitle>
                    <CardDescription>Status da conexão com a central de mensagens.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isConnected ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
                                <Wifi className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-green-500">Conectado e Operando</h3>
                                <p className="text-sm text-muted-foreground mt-1">A IA está monitorando as mensagens.</p>
                                {instanceInfo && (
                                    <p className="text-xs text-muted-foreground mt-2">ID: {instanceInfo.zapi_instance_id}</p>
                                )}
                            </div>
                            <Button variant="destructive" onClick={handleDisconnect} className="mt-4">
                                Desconectar Instância
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-muted-foreground">Desconectado</h3>
                                <p className="text-sm text-muted-foreground mt-1">Nenhum número vinculado no momento.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card do QR Code Dinâmico */}
            {!isConnected && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            Vincular Novo Aparelho
                        </CardTitle>
                        <CardDescription>
                            Aponte a câmera do WhatsApp para iniciar o atendimento IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[250px]">

                        {!showQR && !isGenerating && (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Clique abaixo para solicitar uma nova ponte criptografada com a Z-API.
                                </p>
                                <Button onClick={handleGenerateQR} size="lg" className="w-full sm:w-auto shadow-primary/20 shadow-lg">
                                    Gerar QR Code de Conexão
                                </Button>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                                <div className="w-48 h-48 border-4 border-dashed border-primary/40 rounded-xl flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">Provisionando...</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Alocando infraestrutura na Z-API...</p>
                            </div>
                        )}

                        {showQR && (
                            <div className="flex flex-col items-center space-y-6">
                                {/* Mock do QR Code */}
                                <div className="p-4 bg-white rounded-xl shadow-lg relative cursor-pointer" onClick={handleSimulateConnected} title="Clique aqui para simular que escaneou">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                        <rect x="5" y="5" width="3" height="3"></rect>
                                        <rect x="16" y="5" width="3" height="3"></rect>
                                        <rect x="16" y="16" width="3" height="3"></rect>
                                        <rect x="5" y="16" width="3" height="3"></rect>
                                        <path d="M12 3v18"></path>
                                        <path d="M3 12h18"></path>
                                    </svg>
                                    <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-xl" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-primary">(Simulação: Clique no QR Code para conectar)</p>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            )}
        </div>
    )
}
