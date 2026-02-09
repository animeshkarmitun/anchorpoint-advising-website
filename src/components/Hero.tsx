"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

export default function Hero() {
    const { language } = useLanguage();
    const t = translations[language].hero;

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt="City background"
                    fill
                    className="object-cover scale-105"
                    priority
                />
                {/* Premium Overlay */}
                <div className="absolute inset-0 bg-primary/95" />

                {/* Animated Gradient Orbs */}
                <div className="absolute top-1/4 -right-48 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute top-1/4 right-[15%] text-secondary/10 text-8xl font-thin leading-none animate-[float_6s_ease-in-out_infinite]">+</div>
            <div className="absolute bottom-1/3 left-[12%] text-accent/10 text-8xl font-thin leading-none animate-[float_6s_ease-in-out_infinite_2s]">+</div>

            {/* Content */}
            <div className="container mx-auto px-4 z-10 text-center text-white py-32 relative">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-5xl mx-auto"
                >
                    {/* Premium Badge with Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-10 shadow-2xl"
                    >
                        <Sparkles className="text-accent w-5 h-5" />
                        <span className="text-white font-semibold text-sm tracking-wide">
                            {t.badge}
                        </span>
                        <Sparkles className="text-accent w-5 h-5" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight text-white"
                    >
                        {t.title1}
                        <br />
                        {t.title2}
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-200 mb-14 max-w-3xl mx-auto leading-relaxed font-light"
                    >
                        {t.subtitle}
                    </motion.p>

                    {/* Premium CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link
                            href="#services"
                            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-secondary text-white rounded-xl font-semibold text-lg transition-all shadow-2xl hover:shadow-secondary/50 hover:scale-105 hover:bg-secondary/90"
                        >
                            <span className="relative z-10">{t.btnServices}</span>
                            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="#contact"
                            className="group inline-flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-semibold text-lg transition-all hover:bg-white/20 hover:border-white/50 hover:scale-105 shadow-xl"
                        >
                            <span>{t.btnContact}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="mt-20 flex flex-wrap items-center justify-center gap-12 text-white/80"
                    >
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white mb-1">60+</div>
                            <div className="text-sm uppercase tracking-wider">{t.happyClients}</div>
                        </div>
                        <div className="h-12 w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white mb-1">15+</div>
                            <div className="text-sm uppercase tracking-wider">{t.projectsDone}</div>
                        </div>
                        <div className="h-12 w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white mb-1">3+</div>
                            <div className="text-sm uppercase tracking-wider">{t.yearsExperience}</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
}
