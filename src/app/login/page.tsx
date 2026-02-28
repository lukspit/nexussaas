import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background gradients for premium feel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl z-10">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center">
                        <Image src="/logos/nexus_logo.png" alt="Nexus Logo" width={200} height={60} className="object-contain" priority />
                    </div>
                    <CardDescription className="text-center text-muted-foreground">
                        Entre ou cadastre-se para conectar sua IA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="dr@clinica.com"
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="flex flex-col gap-2 pt-4">
                            <Button formAction={login} className="w-full sm:hover:scale-[1.02] transition-transform">
                                Entrar
                            </Button>
                            <Button formAction={signup} variant="outline" className="w-full sm:hover:scale-[1.02] transition-transform">
                                Criar Conta
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="absolute bottom-4 left-0 right-0 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground z-10">
                <span>Powered by</span>
                <span className="font-semibold text-foreground">lucaspit.ai</span>
            </div>
        </div>
    )
}
