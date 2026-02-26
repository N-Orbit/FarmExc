import { Container } from "@/components/ui/Container";
import Image from "next/image";

export function FutureSection() {
    return (
        <section className="py-24 bg-black">
            <Container>
                <div className="relative rounded-[40px] bg-gradient-to-br from-blue-900/40 to-black border border-white/10 p-12 md:p-20 overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full bg-blue-600/10 blur-[120px] rounded-full group-hover:bg-blue-600/20 transition-colors duration-700" />

                    <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight">
                                Power the Future of Crypto Learning with Stellara AI
                            </h2>
                            <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-lg">
                                An intelligent Web3 crypto academy on Stellar, blending AI-driven
                                learning, social collaboration, and real on-chain trading for the next
                                generation of crypto users.
                            </p>
                        </div>

                        <div className="relative aspect-video w-full max-w-md mx-auto">
                            <div className="absolute inset-0 border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm" />
                            {/* Floating Elements Mockup */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                                    <div className="relative z-10 p-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.48c-.605 0-1.189-.118-1.72-.33a11.934 11.934 0 01-4.9-3.04c-.605-.605-1.114-1.29-1.516-2.043a11.95 11.95 0 01-.844-3.535l-.001-.064a12.11 12.11 0 01.002-1.378l.001-.132a11.95 11.95 0 011.666-4.908l.128-.204a11.96 11.96 0 014.288-4.148c.677-.386 1.4-.69 2.162-.907l.076-.021z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {/* Floating Tokens orbit icons */}
                            <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-blue-500/40 animate-bounce" />
                            <div className="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-purple-500/40 animate-pulse delay-75" />
                            <div className="absolute top-1/2 right-1/4 w-6 h-6 rounded-full bg-yellow-500/40 animate-bounce delay-150" />
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
