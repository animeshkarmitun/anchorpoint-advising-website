"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Award, Users, TrendingUp, FileCheck } from "lucide-react";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

export default function About() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const { language } = useLanguage();
    const t = translations[language].about;

    const features = [
        { icon: <Award size={24} />, text: t.feature1, color: "from-blue-500 to-cyan-500" },
        { icon: <Users size={24} />, text: t.feature2, color: "from-purple-500 to-pink-500" },
        { icon: <TrendingUp size={24} />, text: t.feature3, color: "from-green-500 to-emerald-500" },
        { icon: <FileCheck size={24} />, text: t.feature4, color: "from-orange-500 to-red-500" },
    ];

    return (
        <section id="about" ref={ref} className="py-28 bg-white overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    {/* Image Side with Parallax */}
                    <motion.div
                        style={{ y }}
                        className="w-full lg:w-1/2 relative"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="relative h-[500px] md:h-[650px] w-full rounded-3xl overflow-hidden shadow-2xl">
                                <Image
                                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Taxpert Team"
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-700"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-primary/50" />
                            </div>

                            {/* Floating Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="absolute -bottom-10 -right-10 bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-xl border border-gray-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
                                        <Award className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-primary">15+</div>
                                        <div className="text-sm text-gray-600">{t.yearsExp}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full lg:w-1/2"
                    >
                        <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-bold tracking-widest uppercase text-sm mb-4 rounded-full">
                            {t.badge}
                        </span>
                        <h2 className="text-5xl md:text-6xl font-extrabold text-primary mb-6 leading-tight">
                            {t.title1}<br />
                            <span className="text-secondary">
                                {t.title2}
                            </span>
                        </h2>
                        <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                            {t.description}
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <div className="text-white">
                                            {feature.icon}
                                        </div>
                                    </div>
                                    <span className="text-gray-700 font-semibold text-base">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative px-10 py-5 bg-secondary text-white rounded-xl font-semibold text-lg transition-all shadow-xl hover:shadow-2xl hover:bg-secondary/90"
                        >
                            <span className="relative z-10">{t.btnLearnMore}</span>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
