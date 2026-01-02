"use client";

import { useState } from "react";
import { Calendar, Clock, CheckCircle2, Video } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import CalendlyModal from "./CalendlyModal";

export default function Consultation() {
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
    const { language } = useLanguage();
    const t = translations[language].consultation;

    const calendlyUrl = "https://calendly.com/anchorpointadvising/30min";

    const features = [
        { icon: Calendar, text: t.feature1 },
        { icon: Clock, text: t.feature2 },
        { icon: Video, text: t.feature3 },
        { icon: CheckCircle2, text: t.feature4 },
    ];

    return (
        <>
            <section className="py-20 bg-gradient-to-br from-secondary/5 via-white to-primary/5 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 md:px-6 relative">
                    <div className="max-w-5xl mx-auto">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex justify-center mb-6"
                        >
                            <span className="inline-block px-6 py-2 bg-secondary/10 text-secondary rounded-full text-secondary font-bold">
                                {t.badge}
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold text-center mb-6"
                        >
                            <span className="text-primary">{t.title1}</span>{" "}
                            <span className="text-secondary">{t.title2}</span>
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-600 text-center text-lg mb-12 max-w-3xl mx-auto leading-relaxed"
                        >
                            {t.subtitle}
                        </motion.p>

                        {/* Features Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="grid md:grid-cols-2 gap-6 mb-12"
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                                        <feature.icon className="text-secondary" size={24} />
                                    </div>
                                    <p className="text-gray-700 font-medium">{feature.text}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                            className="flex justify-center"
                        >
                            <button
                                onClick={() => setIsCalendlyOpen(true)}
                                className="group relative px-10 py-5 bg-secondary text-white rounded-2xl font-bold text-lg transition-all shadow-2xl hover:shadow-secondary/50 hover:scale-105"
                            >
                                <span className="relative flex items-center gap-3">
                                    <Calendar size={24} />
                                    {t.cta}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/80 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Calendly Modal */}
            <CalendlyModal
                isOpen={isCalendlyOpen}
                onClose={() => setIsCalendlyOpen(false)}
                calendlyUrl={calendlyUrl}
            />
        </>
    );
}
