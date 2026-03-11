"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

interface ServiceTier {
    title: string;
    subtitle: string;
    priceLabel: string;
    priceAmount: string;
    priceCurrency?: string;
    features: string[];
}

export default function Services() {
    const { language } = useLanguage();
    const t = translations[language].services;

    const individualTax: ServiceTier = t.individualTax as ServiceTier;
    const businessTax: ServiceTier = t.businessTax as ServiceTier;

    return (
        <section id="services" className="py-24 md:py-32 bg-gray-50 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/3 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Main Card */}
                    <div className="bg-white rounded-3xl shadow-premium overflow-hidden">
                        {/* ── Section Title ─────────────────────────── */}
                        <div className="pt-10 pb-6 px-6 md:px-12 text-center">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.15, duration: 0.5 }}
                                className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight"
                                style={{ fontStyle: "italic" }}
                            >
                                {t.sectionTitle}
                            </motion.h2>
                        </div>

                        {/* ── Individual Tax Tier ────────────────────── */}
                        <ServiceTierBlock
                            tier={individualTax}
                            delay={0.2}
                            showCurrency
                        />

                        {/* Divider */}
                        <div className="mx-6 md:mx-12">
                            <div className="border-t border-gray-200" />
                        </div>

                        {/* ── Business / Corporate Tier ──────────────── */}
                        <ServiceTierBlock
                            tier={businessTax}
                            delay={0.35}
                            isCustom
                        />

                        {/* ── CTA Button ────────────────────────────── */}
                        <div className="px-6 md:px-12 pb-6 pt-2">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                            >
                                <Link
                                    href="#consultation"
                                    className="block w-full text-center bg-secondary hover:bg-secondary/90 text-white text-lg md:text-xl font-bold py-4 md:py-5 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-secondary/30 active:scale-[0.98]"
                                >
                                    {t.ctaButton}
                                </Link>
                            </motion.div>
                        </div>

                        {/* ── Guarantee Footer ──────────────────────── */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6, duration: 0.4 }}
                            className="pb-8 px-6 md:px-12 text-center"
                        >
                            <p className="text-gray-500 text-sm flex items-center justify-center gap-4 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <CheckMark />
                                    {t.guarantee1}
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckMark />
                                    {t.guarantee2}
                                </span>
                            </p>
                        </motion.div>
                    </div>

                    {/* Bottom gradient glow */}
                    <div className="h-24 bg-gradient-to-b from-transparent to-gray-50 -mt-1 relative z-20 rounded-b-3xl" />
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════
   Service Tier Block (reusable for each tier)
   ═══════════════════════════════════════════════ */

function ServiceTierBlock({
    tier,
    delay = 0,
    showCurrency = false,
    isCustom = false,
}: {
    tier: ServiceTier;
    delay?: number;
    showCurrency?: boolean;
    isCustom?: boolean;
}) {
    // Split features into two columns
    const mid = Math.ceil(tier.features.length / 2);
    const leftFeatures = tier.features.slice(0, mid);
    const rightFeatures = tier.features.slice(mid);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="px-6 md:px-12 py-8"
        >
            {/* Header Row: Title + Price */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-primary leading-tight">
                        {tier.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {tier.subtitle}
                    </p>
                </div>
                <div className="text-right sm:text-right mt-2 sm:mt-0 flex-shrink-0">
                    <span className="block text-[11px] md:text-xs font-bold tracking-wider text-gray-400 uppercase">
                        {tier.priceLabel}
                    </span>
                    <span
                        className={`font-extrabold text-secondary leading-none ${isCustom
                                ? "text-3xl md:text-4xl mt-1 block"
                                : "text-3xl md:text-4xl mt-0.5 block"
                            }`}
                    >
                        {tier.priceAmount}
                        {showCurrency && tier.priceCurrency && (
                            <span className="text-base md:text-lg font-bold text-gray-600 ml-1">
                                {tier.priceCurrency}
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-6">
                <div className="space-y-3">
                    {leftFeatures.map((feature, i) => (
                        <FeatureItem key={i} text={feature} />
                    ))}
                </div>
                <div className="space-y-3">
                    {rightFeatures.map((feature, i) => (
                        <FeatureItem key={i} text={feature} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════
   Feature Item (checkmark + text)
   ═══════════════════════════════════════════════ */

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <CheckCircle
                size={18}
                className="text-secondary flex-shrink-0 mt-0.5"
                strokeWidth={2.5}
            />
            <span className="text-gray-700 text-sm leading-snug">{text}</span>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Small Checkmark for guarantee footer
   ═══════════════════════════════════════════════ */

function CheckMark() {
    return (
        <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
            />
        </svg>
    );
}
