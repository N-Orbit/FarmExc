import { Container } from "@/components/ui/Container";
import Image from "next/image";

export function HandsSection() {
    return (
        <section className="py-24 bg-black overflow-hidden">
            <Container>
                <div className="relative w-full max-w-5xl mx-auto rounded-[32px] overflow-hidden bg-[#111114] border border-white/5 min-h-[380px] flex">

                    {/* Left: UI Mockup (wallet/dashboard cards) */}
                    <div className="relative flex-1 flex items-center justify-center p-10 md:p-14">
                        {/* Outermost / back card */}
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 w-[52%] h-[58%] rounded-2xl bg-[#1c1c20] border border-white/[0.06]" />

                        {/* Middle card */}
                        <div className="absolute left-14 top-1/2 -translate-y-[45%] w-[58%] h-[60%] rounded-2xl bg-[#222228] border border-white/[0.07]" />

                        {/* Front / top card — contains Bitcoin icon */}
                        <div className="relative z-10 w-[62%] h-[64%] rounded-2xl bg-[#282830] border border-white/10 flex items-center justify-center ml-6">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-2xl">
                                <span className="text-black text-2xl font-bold leading-none">₿</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Hands image */}
                    <div className="relative w-[48%] flex-shrink-0">
                        <Image
                            src="/hands_connection.png"
                            alt="Human and AI connection"
                            fill
                            className="object-cover object-center"
                        />
                    </div>

                </div>
            </Container>
        </section>
    );
}
