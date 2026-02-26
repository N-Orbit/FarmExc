import { Container } from "@/components/ui/Container";
import Image from "next/image";

const tradingFeatures = [
    { id: 1, title: "Smart Stellar Trading", description: "Execute trades instantly on the Stellar network with secure, low-fee transactions." },
    { id: 2, title: "AI-Powered Market Insights", description: "Get real-time AI summaries and trading insights to make informed decisions." },
    { id: 3, title: "Seamless Wallet Integration", description: "Connect your Freighter wallet effortlessly and manage assets in one place." },
    { id: 4, title: "Portfolio Tracking", description: "Monitor balances, performance, and transaction history with a clean dashboard view." },
    { id: 5, title: "Secure & Transparent Smart Stellar Trading", description: "On-chain transactions ensure full transparency and blockchain-level security." },
];

export function TradingFeaturesSection() {
    return (
        <section className="py-24 bg-black">
            <Container>
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Left Side: 3D Wave Visual */}
                    <div className="relative aspect-square w-full max-w-xl mx-auto lg:mx-0">
                        <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full" />
                        <Image
                            src="/crypto_wave_coins_3d.png"
                            alt="3D Crypto Wave"
                            fill
                            className="object-contain relative z-10"
                        />
                    </div>

                    {/* Right Side: Features List */}
                    <div className="space-y-12">
                        {tradingFeatures.map((feature) => (
                            <div key={feature.id} className="flex gap-6 group">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
                                    {feature.id}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-white/50 leading-relaxed font-light">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}
