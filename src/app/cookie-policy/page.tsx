"use client";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Cookie, Mail, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Section {
    heading: string;
    content: string;
    subsections?: { heading: string; content: string }[];
    bullets?: string[];
    note?: string;
    contactEmail?: string;
    contactWebsite?: string;
}

export default function CookiePolicyPage() {
    const { language } = useLanguage();
    const t = translations[language].cookiePolicy;

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Banner */}
            <section className="relative bg-primary pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 rounded-2xl mb-6">
                            <Cookie size={32} className="text-secondary" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            {t.title}
                        </h1>
                        <p className="text-gray-300 text-lg">
                            {language === "bn" ? "সর্বশেষ হালনাগাদ" : "Last Updated"}: {t.lastUpdated}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        {/* Back to Home */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-10"
                        >
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 font-medium transition-colors"
                            >
                                <ArrowLeft size={18} />
                                {language === "bn" ? "হোমে ফিরে যান" : "Back to Home"}
                            </Link>
                        </motion.div>

                        {/* Sections */}
                        <div className="space-y-10">
                            {t.sections.map((section: Section, index: number) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
                                >
                                    <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-secondary rounded-full flex-shrink-0" />
                                        {section.heading}
                                    </h2>

                                    {/* Main content */}
                                    {section.content.split("\n\n").map((paragraph: string, pIdx: number) => (
                                        <p key={pIdx} className="text-gray-600 leading-relaxed mb-3 text-base">
                                            {paragraph}
                                        </p>
                                    ))}

                                    {/* Subsections */}
                                    {section.subsections && (
                                        <div className="mt-5 space-y-4 pl-4 border-l-2 border-gray-100">
                                            {section.subsections.map((sub: { heading: string; content: string }, sIdx: number) => (
                                                <div key={sIdx}>
                                                    <h3 className="text-lg font-semibold text-primary/90 mb-1.5">
                                                        {sub.heading}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed text-base">
                                                        {sub.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Bullets */}
                                    {section.bullets && (
                                        <ul className="mt-4 space-y-2">
                                            {section.bullets.map((bullet: string, bIdx: number) => (
                                                <li key={bIdx} className="flex items-center gap-2 text-gray-600 text-base">
                                                    <div className="w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Note */}
                                    {section.note && (
                                        <p className="mt-4 text-gray-500 text-sm italic bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {section.note}
                                        </p>
                                    )}

                                    {/* Contact info */}
                                    {section.contactEmail && (
                                        <div className="mt-5 space-y-3">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Mail size={16} className="text-secondary" />
                                                </div>
                                                <a href={`mailto:${section.contactEmail}`} className="hover:text-secondary transition-colors">
                                                    {section.contactEmail}
                                                </a>
                                            </div>
                                            {section.contactWebsite && (
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Globe size={16} className="text-secondary" />
                                                    </div>
                                                    <a href={section.contactWebsite} className="hover:text-secondary transition-colors">
                                                        {section.contactWebsite}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            <WhatsAppButton />
        </main>
    );
}
