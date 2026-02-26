import { Container } from "@/components/ui/Container";
import Image from "next/image";

const StarIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
    </svg>
);

const GridIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="2.5" fill="white" />
        <circle cx="12" cy="6" r="2.5" fill="white" />
        <circle cx="18" cy="6" r="2.5" fill="white" />
        <circle cx="6" cy="12" r="2.5" fill="white" />
        <circle cx="12" cy="12" r="2.5" fill="white" />
        <circle cx="18" cy="12" r="2.5" fill="white" />
        <circle cx="6" cy="18" r="2.5" fill="white" />
        <circle cx="12" cy="18" r="2.5" fill="white" />
        <circle cx="18" cy="18" r="2.5" fill="white" />
    </svg>
);

const FeatherIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8 6 4 9 4 14C4 18 7.5 21 12 21C16.5 21 20 18 20 14C20 9 16 6 12 2Z" fill="white" opacity="0.9" />
        <path d="M12 8L12 20" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 12L12 10L16 12" stroke="black" strokeWidth="1" strokeLinecap="round" />
    </svg>
);

const insights = [
    {
        title: "AI Market Brief",
        description: "Get daily AI-powered summaries of crypto trends, price movements, and key market signals—explained in simple, beginner-friendly language.",
        image: "/insight_purple.png",
        icon: <StarIcon />,
        cardBg: "bg-[#1a0a35]",
        titleColor: "text-white",
        descColor: "text-white/60",
        isCenter: false,
    },
    {
        title: "Smart Learning Paths",
        description: "Master crypto from beginner to pro with AI-guided lessons and instant feedback.",
        image: "/insight_blue.png",
        icon: <GridIcon />,
        cardBg: "bg-[#eef0ff]",
        titleColor: "text-[#1a0a35]",
        descColor: "text-[#1a0a35]/60",
        isCenter: true,
    },
    {
        title: "Trade with Confidence",
        description: "Turn knowledge into action with secure, seamless Stellar-based trading tools that bridge learning and real-world crypto activity.",
        image: "/insight_indigo.png",
        icon: <FeatherIcon />,
        cardBg: "bg-[#1a0a35]",
        titleColor: "text-white",
        descColor: "text-white/60",
        isCenter: false,
    },
];

export function InsightsSection() {
    return (
        <section className="py-24 bg-black">
            <Container>
                {/* Heading */}
                <div className="mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-5">
                        <span className="text-fuchsia-400 italic">Stay Inspired</span>
                        <span className="text-white"> with our latest</span>
                        <br />
                        <span className="text-white">insights with </span>
                        <span className="text-fuchsia-400">Stellara Ai.</span>
                    </h2>
                    <p className="text-white/40 text-base md:text-lg font-light max-w-lg">
                        Stay ahead with AI-generated market intelligence, educational
                        tips, and real-time Stellar ecosystem updates.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-3 gap-6 items-start">
                    {insights.map((insight) => (
                        <div
                            key={insight.title}
                            className={`
                                relative rounded-[28px] overflow-hidden flex flex-col p-6 gap-5
                                ${insight.cardBg}
                                ${insight.isCenter
                                    ? "shadow-[0_0_80px_rgba(147,51,234,0.55)] md:-mt-4 md:pb-10"
                                    : "border border-white/5"
                                }
                            `}
                        >
                            {/* Icon badge */}
                            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center flex-shrink-0">
                                {insight.icon}
                            </div>

                            {/* Title */}
                            <h3 className={`text-2xl md:text-3xl font-serif leading-tight ${insight.titleColor}`}>
                                {insight.title}
                            </h3>

                            {/* Image */}
                            <div className="relative w-full h-44 rounded-2xl overflow-hidden">
                                <Image
                                    src={insight.image}
                                    alt={insight.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Description */}
                            <p className={`text-sm md:text-base leading-relaxed font-light ${insight.descColor}`}>
                                {insight.description}
                            </p>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
