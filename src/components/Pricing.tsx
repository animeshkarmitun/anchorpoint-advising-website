"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
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

                {/* Pricing Cards Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Consultation Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 h-full">
                            {/* Consultation Badge */}
                            <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-3xl font-bold flex items-center gap-2">
                                <Sparkles size={18} />
                                {t.consultationBadge}
                            </div>

                            <div className="p-12">
                                {/* Package Name */}
                                <h3 className="text-3xl font-bold text-primary mb-4">
                                    {t.consultationPackageName}
                                </h3>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-extrabold text-primary">
                                            {t.consultationPrice}
                                        </span>
                                        <span className="text-2xl text-gray-600 font-semibold">
                                            {t.currency}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mt-2 text-lg">
                                        {t.consultationPriceDescription}
                                    </p>
                                </div>

                                {/* Features List */}
                                <div className="space-y-4 mb-10">
                                    {t.consultationFeatures.map((feature: string, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + index * 0.1 }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                                                <Check className="text-primary" size={16} />
                                            </div>
                                            <span className="text-gray-700 text-lg leading-relaxed">
                                                {feature}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePackageSelect('consultation')}
                                    className="w-full bg-primary text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-primary/90"
                                >
                                    {t.consultationCta}
                                </motion.button>

                                {/* Additional Info */}
                                <p className="text-center text-gray-500 mt-6 text-sm">
                                    {t.consultationAdditionalInfo}
                                </p>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
                        </div>
                    </motion.div>

                    {/* Complete Tax Solution Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-500 h-full">
                            {/* Popular Badge */}
                            <div className="absolute top-0 right-0 bg-secondary text-white px-6 py-2 rounded-bl-3xl font-bold flex items-center gap-2">
                                <Sparkles size={18} />
                                {t.popularBadge}
                            </div>

                            <div className="p-12">
                                {/* Package Name */}
                                <h3 className="text-3xl font-bold text-primary mb-4">
                                    {t.packageName}
                                </h3>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-extrabold text-secondary">
                                            {t.price}
                                        </span>
                                        <span className="text-2xl text-gray-600 font-semibold">
                                            {t.currency}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mt-2 text-lg">
                                        {t.priceDescription}
                                    </p>
                                </div>

                                {/* Features List */}
                                <div className="space-y-4 mb-10">
                                    {t.features.map((feature: string, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + index * 0.1 }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center mt-1">
                                                <Check className="text-secondary" size={16} />
                                            </div>
                                            <span className="text-gray-700 text-lg leading-relaxed">
                                                {feature}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePackageSelect('solution')}
                                    className="w-full bg-secondary text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-secondary/90"
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
