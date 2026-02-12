"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";
import { Users, Briefcase, Award, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

interface StatItemProps {
    end: number;
    label: string;
    suffix?: string;
    icon: React.ReactNode;
    gradient: string;
}

function AnimatedCounter({ end, label, suffix = "", icon, gradient }: StatItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { duration: 3000 });
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            motionValue.set(end);
        }
    }, [isInView, end, motionValue]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.floor(latest).toLocaleString() + suffix;
            }
        });
    }, [springValue, suffix]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, scale: 1.05 }}
            className="group relative bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer"
        >
            {/* Background on Hover */}
            <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon */}
            <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl mx-auto">
                <div className="text-white">
                    {icon}
                </div>
            </div>

            {/* Number */}
            <div ref={ref} className="text-6xl font-extrabold text-primary mb-3 text-center">
                0
            </div>

            {/* Label */}
            <p className="text-gray-600 font-semibold text-lg text-center">{label}</p>

            {/* Decorative Element */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-2xl" />
        </motion.div>
    );
}

export default function Stats() {
    const { language } = useLanguage();
    const t = translations[language].stats;

    return (
        <section className="py-28 bg-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex justify-center mb-6"
                    >
                        <span className="inline-flex items-center gap-2 px-6 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold">
                            {/* <Award size={24} /> */}
                            {t.badge}
                        </span>
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-extrabold text-primary mb-6"
                    >
                        {t.title1}{" "}
                        <span className="text-secondary">
                            {t.title2}
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-600 text-xl max-w-2xl mx-auto"
                    >
                        {t.subtitle}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatedCounter
                        end={60}
                        label={t.stat1}
                        suffix="+"
                        icon={<Users size={40} />}
                        gradient="from-blue-500 to-cyan-500"
                    />
                    <AnimatedCounter
                        end={15}
                        label={t.stat2}
                        suffix="+"
                        icon={<Briefcase size={40} />}
                        gradient="from-purple-500 to-pink-500"
                    />
                    <AnimatedCounter
                        end={3}
                        label={t.stat3}
                        suffix="+"
                        icon={<TrendingUp size={40} />}
                        gradient="from-green-500 to-emerald-500"
                    />
                    {/* <AnimatedCounter
                        end={120}
                        label={t.stat4}
                        suffix="+"
                        icon={<Award size={40} />}
                        gradient="from-orange-500 to-red-500"
                    /> */}
                </div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-16"
                >
                    <a
                        href="#pricing"
                        className="inline-flex items-center gap-2 px-10 py-4 bg-secondary text-white font-bold text-lg rounded-full hover:bg-secondary/90 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    >
                        {t.cta}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
