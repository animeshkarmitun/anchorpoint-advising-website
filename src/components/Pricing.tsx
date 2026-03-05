"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";
import PackagePurchaseModal from "./PackagePurchaseModal";

export default function Pricing() {
    const { language } = useLanguage();
    const t = translations[language].pricing;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{
        type: 'consultation' | 'solution';
        price: number;
    } | null>(null);

    const handlePackageSelect = (packageType: 'consultation' | 'solution') => {
        if (packageType === 'consultation') {
            setSelectedPackage({ type: 'consultation', price: 299 });
        } else {
            setSelectedPackage({ type: 'solution', price: 1500 });
        }
        setIsModalOpen(true);
    };

    return (
        <section className="py-28 bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

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

                {/* Single Pricing Card */}
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-500">
                            <div className="p-12">
                                {/* Card Title */}
                                <h3 className="text-3xl font-bold text-primary mb-10 text-center">
                                    {t.packageName}
                                </h3>

                                {/* Services List */}
                                <div className="space-y-8">
                                    {t.services.map((service: { name: string; price: string; currency: string; priceNote: string; description: string; features: string[] }, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + index * 0.2 }}
                                        >
                                            {index > 0 && (
                                                <div className="border-t-2 border-gray-100 mb-8" />
                                            )}
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                                {/* Service Info */}
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-bold text-primary mb-1">
                                                        {service.name}
                                                    </h4>
                                                    <p className="text-gray-600 text-base">
                                                        {service.description}
                                                    </p>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                        {service.priceNote}
                                                    </p>
                                                    <div className="flex items-baseline gap-1 justify-end">
                                                        <span className="text-3xl md:text-4xl font-extrabold text-secondary">
                                                            {service.price}
                                                        </span>
                                                        {service.currency && (
                                                            <span className="text-lg text-gray-600 font-semibold">
                                                                {service.currency}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features List */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {service.features.map((feature: string, fIndex: number) => (
                                                    <div key={fIndex} className="flex items-start gap-3">
                                                        <div className="shrink-0 w-5 h-5 bg-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                                                            <Check className="text-secondary" size={14} />
                                                        </div>
                                                        <span className="text-gray-700 text-sm leading-relaxed">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePackageSelect('solution')}
                                    className="w-full bg-secondary text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-secondary/90 mt-10"
                                >
                                    {t.cta}
                                </motion.button>

                                {/* Additional Info */}
                                <p className="text-center text-gray-500 mt-6 text-sm">
                                    {t.additionalInfo}
                                </p>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                        </div>
                    </motion.div>
                </div>

                {/* Package Purchase Modal */}
                {
                    selectedPackage && (
                        <PackagePurchaseModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            packageType={selectedPackage.type}
                            packagePrice={selectedPackage.price}
                        />
                    )
                }
            </div >
        </section >
    );
}
