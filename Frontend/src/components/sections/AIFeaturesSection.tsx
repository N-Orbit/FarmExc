import Image from "next/image";
import { Container } from "@/components/ui/Container";

const features = [
    {
        title: "Learn crypto the smart way with guided lessons, quizzes, and real explanations powered by AI – from beginner basics to advanced trading concepts.",
        position: "top-left",
    },
    {
        title: "Chat or speak with Stellara AI to understand markets, strategies, and Stellar tools – available 24/7 to guide your learning journey.",
        position: "top-right",
    },
    {
        title: "Join a social crypto community to share ideas, discuss trends, and connect with traders, builders, and educators in real time.",
        position: "bottom-left",
    },
    {
        title: "Connect your wallet, explore Stellar assets, track your portfolio, and move from learning to real-on-chain trading seamlessly.",
        position: "bottom-right",
    },
];

export function AIFeaturesSection() {
    return (
        <section className="py-24 bg-black overflow-hidden relative">
            <Container>
                <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                    {/* Left Side Features */}
                    <div className="space-y-32 order-2 lg:order-1">
                        {features.filter((f, i) => i % 2 === 0).map((f) => (
                            <p key={f.position} className="text-white/60 text-lg leading-relaxed max-w-sm">
                                {f.title}
                            </p>
                        ))}
                    </div>

                    {/* Center Image */}
                    <div className="relative aspect-square w-full max-w-md mx-auto order-1 lg:order-2 group">
                        <div className="absolute inset-0 bg-blue-600/20 blur-[120px] rounded-full group-hover:bg-blue-600/30 transition-colors duration-700" />
                        <Image
                            src="/ai_head_central.png"
                            alt="AI Assistant Visualization"
                            fill
                            className="object-contain relative z-10 transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>

                    {/* Right Side Features */}
                    <div className="space-y-32 order-3 text-right">
                        {features.filter((f, i) => i % 2 !== 0).map((f) => (
                            <p key={f.position} className="text-white/60 text-lg leading-relaxed max-w-sm ml-auto">
                                {f.title}
                            </p>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}
