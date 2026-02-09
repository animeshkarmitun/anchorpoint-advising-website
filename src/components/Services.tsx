"use client";

import { motion } from "framer-motion";
import { Calculator, PieChart, TrendingUp, FileText, Users, Briefcase } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

export default function Services() {
    const { language } = useLanguage();
    const t = translations[language].services;

    const services = [
        {
            icon: <Calculator size={48} />,
            title: t.service1Title,
            description: t.service1Desc,
            gradient: "from-blue-500 to-cyan-500",
        },
        // {
        //     icon: <PieChart size={48} />,
        //     title: t.service2Title,
        //     description: t.service2Desc,
        //     gradient: "from-purple-500 to-pink-500",
        // },
        // {
        //     icon: <TrendingUp size={48} />,
        //     title: t.service3Title,
        //     description: t.service3Desc,
        //     gradient: "from-green-500 to-emerald-500",
        // },
        {
            icon: <FileText size={48} />,
            title: t.service4Title,
            description: t.service4Desc,
            gradient: "from-orange-500 to-red-500",
        },
        // {
        //     icon: <Users size={48} />,
        //     title: t.service5Title,
        //     description: t.service5Desc,
        //     gradient: "from-indigo-500 to-blue-500",
        // },
        {
            icon: <Briefcase size={48} />,
            title: t.service6Title,
            description: t.service6Desc,
            gradient: "from-amber-500 to-yellow-500",
        },
    ];

    return (
        <section id="services" className="py-28 bg-gray-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-bold tracking-widest uppercase text-sm mb-4 rounded-full"
                    >
                        {t.badge}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-extrabold text-primary mb-6"
                    >
                        {t.title1}<br />
                        <span className="text-secondary">
                            {t.title2}
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed"
                    >
                        {t.subtitle}
                    </motion.p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden cursor-pointer"
                        >
                            {/* Background on Hover */}
                            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />



                            {/* Content */}
                            <div className="relative z-10 text-center md:text-left">
                                {/* Icon with Background */}
                                <div className="w-24 h-24 bg-secondary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl mx-auto md:mx-0">
                                    <div className="text-white">
                                        {service.icon}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-primary mb-4 group-hover:text-secondary transition-colors duration-300">
                                    {service.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 leading-relaxed text-base mb-6">
                                    {service.description}
                                </p>

                                {/* Learn More Link */}
                                <div className="flex items-center justify-center md:justify-start gap-2 text-secondary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span>{t.learnMore}</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
