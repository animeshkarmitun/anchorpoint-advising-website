"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Sparkles,
    ChevronDown,
    CheckCircle,
    Calculator,
    FileText,
    ClipboardList,
    TrendingDown,
    TrendingUp,
    UserPlus,
    RefreshCw,
    ShieldCheck,
    Target,
    Clock,
    Lock,
    FolderOpen,
    Users,
    AlertCircle,
    Search,
    Award,
    Globe,
    DollarSign,
    Home,
    Wifi,
    BookOpen,
    Headphones,
    AlertTriangle,
    Phone,
    Briefcase,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CalendlyModal from "@/components/CalendlyModal";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Icon resolver                                                      */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, React.ElementType> = {
    Calculator,
    FileText,
    ClipboardList,
    TrendingDown,
    TrendingUp,
    UserPlus,
    RefreshCw,
    ShieldCheck,
    Target,
    Clock,
    Lock,
    FolderOpen,
    Users,
    AlertCircle,
    Search,
    Award,
    Globe,
    DollarSign,
    Home,
    Wifi,
    BookOpen,
    Headphones,
    AlertTriangle,
    Phone,
    Briefcase,
};

function getIcon(name: string, size = 24) {
    const IconComponent = iconMap[name] || CheckCircle;
    return <IconComponent size={size} />;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ServiceItem {
    text: string;
    icon?: string;
}

interface Section {
    id: string;
    title: string;
    type: "bullets" | "services" | "features" | "warning" | "steps";
    intro?: string;
    note?: string;
    items: (string | ServiceItem)[];
}

interface FAQ {
    question: string;
    answer: string;
}

interface RelatedService {
    title: string;
    href: string;
}

export interface ServicePageContent {
    hero: {
        badge: string;
        headline: string;
        subtext: string;
        cta1: string;
        cta2: string;
    };
    h1: string;
    sections: Section[];
    cta: {
        headline: string;
        subtext: string;
        button: string;
    };
    faq: FAQ[];
    relatedServices: RelatedService[];
}

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */
function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
            >
                <div className="flex items-center gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                    </span>
                    <span className="font-semibold text-primary text-lg">
                        {faq.question}
                    </span>
                </div>
                <ChevronDown
                    className={`flex-shrink-0 w-5 h-5 text-secondary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                />
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="px-6 pb-5 pl-18 text-gray-600 leading-relaxed">
                    {faq.answer}
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Section Renderers                                                  */
/* ------------------------------------------------------------------ */
function BulletSection({ section }: { section: Section }) {
    return (
        <div>
            {section.intro && (
                <p className="text-gray-700 text-lg mb-5 font-medium">
                    {section.intro}
                </p>
            )}
            <ul className="space-y-3">
                {section.items.map((item, i) => (
                    <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-3 text-gray-700 text-lg"
                    >
                        <CheckCircle className="flex-shrink-0 w-6 h-6 text-secondary mt-0.5" />
                        <span>{typeof item === "string" ? item : item.text}</span>
                    </motion.li>
                ))}
            </ul>
            {section.note && (
                <p className="mt-4 text-secondary font-medium text-base italic">
                    → {section.note}
                </p>
            )}
        </div>
    );
}

function ServicesGrid({ section }: { section: Section }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(section.items as ServiceItem[]).map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -4 }}
                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group"
                >
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                        {item.icon ? getIcon(item.icon) : <CheckCircle size={24} />}
                    </div>
                    <p className="font-semibold text-primary text-base">
                        {item.text}
                    </p>
                </motion.div>
            ))}
        </div>
    );
}

function FeaturesSection({ section }: { section: Section }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(section.items as ServiceItem[]).map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
                >
                    <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent flex-shrink-0">
                        {item.icon ? getIcon(item.icon, 28) : <CheckCircle size={28} />}
                    </div>
                    <p className="font-semibold text-primary text-lg">
                        {item.text}
                    </p>
                </motion.div>
            ))}
        </div>
    );
}

function WarningSection({ section }: { section: Section }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
                <h3 className="text-xl font-bold text-red-700">{section.title}</h3>
            </div>
            {section.intro && (
                <p className="text-red-700 text-lg mb-4 font-medium">
                    {section.intro}
                </p>
            )}
            <ul className="space-y-3">
                {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-red-700 text-base">
                        <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                        <span>{typeof item === "string" ? item : item.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function StepsSection({ section }: { section: Section }) {
    return (
        <div className="relative">
            {section.items.map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-start gap-5 mb-8 last:mb-0"
                >
                    <div className="relative flex flex-col items-center">
                        <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                            {i + 1}
                        </div>
                        {i < section.items.length - 1 && (
                            <div className="w-0.5 h-12 bg-secondary/20 mt-2" />
                        )}
                    </div>
                    <div className="pt-2.5">
                        <p className="text-primary font-semibold text-lg">
                            {typeof item === "string" ? item : item.text}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function renderSection(section: Section) {
    switch (section.type) {
        case "bullets":
            return <BulletSection section={section} />;
        case "services":
            return <ServicesGrid section={section} />;
        case "features":
            return <FeaturesSection section={section} />;
        case "warning":
            return <WarningSection section={section} />;
        case "steps":
            return <StepsSection section={section} />;
        default:
            return <BulletSection section={section} />;
    }
}

/* ------------------------------------------------------------------ */
/*  Main Layout                                                        */
/* ------------------------------------------------------------------ */
export default function ServicePageLayout({
    content,
}: {
    content: ServicePageContent;
}) {
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
    const { setLanguage } = useLanguage();
    const calendlyUrl = "https://calendly.com/anchorpointadvising/30min";

    // Force English on these service pages
    useEffect(() => {
        setLanguage("en");
    }, [setLanguage]);

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* ====== HERO ====== */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                        alt="Tax filing background"
                        fill
                        className="object-cover scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-primary/95" />
                    <div className="absolute top-1/4 -right-48 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/4 right-[15%] text-secondary/10 text-8xl font-thin leading-none animate-[float_6s_ease-in-out_infinite]">
                    +
                </div>
                <div className="absolute bottom-1/3 left-[12%] text-accent/10 text-8xl font-thin leading-none animate-[float_6s_ease-in-out_infinite_2s]">
                    +
                </div>

                <div className="container mx-auto px-4 z-10 text-center text-white py-32 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-10 shadow-2xl"
                        >
                            <Sparkles className="text-accent w-5 h-5" />
                            <span className="text-white font-semibold text-sm tracking-wide">
                                {content.hero.badge}
                            </span>
                            <Sparkles className="text-accent w-5 h-5" />
                        </motion.div>

                        {/* H1 */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white"
                        >
                            {content.h1}
                        </motion.h1>

                        {/* Headline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-2xl md:text-3xl font-bold mb-4 text-accent"
                        >
                            {content.hero.headline}
                        </motion.p>

                        {/* Subtext */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
                        >
                            {content.hero.subtext}
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-5"
                        >
                            <Link
                                href="#contact-cta"
                                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-secondary text-white rounded-xl font-semibold text-lg transition-all shadow-2xl hover:shadow-secondary/50 hover:scale-105 hover:bg-secondary/90"
                            >
                                <span className="relative z-10">
                                    {content.hero.cta1}
                                </span>
                                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <button
                                onClick={() => setIsCalendlyOpen(true)}
                                className="group inline-flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-semibold text-lg transition-all hover:bg-white/20 hover:border-white/50 hover:scale-105 shadow-xl"
                            >
                                <span>{content.hero.cta2}</span>
                                <Phone className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ====== CONTENT SECTIONS ====== */}
            <div>
                {content.sections.map((section, idx) => {
                    // Warning sections get their own row with alternating bg
                    if (section.type === "warning") {
                        return (
                            <div
                                key={section.id}
                                className={`${idx % 2 === 1 ? "bg-gray-50" : "bg-white"} py-16`}
                            >
                                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                    >
                                        {renderSection(section)}
                                    </motion.div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={section.id}
                            className={`${idx % 2 === 1 ? "bg-gray-50" : "bg-white"} py-16`}
                        >
                            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-8">
                                        {section.title}
                                    </h2>
                                    {renderSection(section)}
                                </motion.div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ====== FAQ ====== */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-bold tracking-widest uppercase text-sm mb-4 rounded-full">
                            FAQ
                        </span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-primary">
                            Frequently Asked Questions
                        </h2>
                    </motion.div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {content.faq.map((faq, i) => (
                            <FAQItem key={i} faq={faq} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== BOTTOM CTA ====== */}
            <section
                id="contact-cta"
                className="relative py-24 overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-2xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                            {content.cta.headline}
                        </h2>
                        <p className="text-xl text-gray-300 mb-10">
                            {content.cta.subtext}
                        </p>
                        <button
                            onClick={() => setIsCalendlyOpen(true)}
                            className="group inline-flex items-center gap-3 px-12 py-5 bg-secondary text-white rounded-xl font-semibold text-lg transition-all shadow-2xl hover:shadow-secondary/50 hover:scale-105 hover:bg-secondary/90"
                        >
                            <span>{content.cta.button}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ====== RELATED SERVICES ====== */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h3 className="text-2xl font-bold text-primary mb-8 text-center">
                        Explore Related Services
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        {content.relatedServices.map((rs) => (
                            <Link
                                key={rs.href}
                                href={rs.href}
                                className="group flex items-center gap-3 px-8 py-4 border-2 border-secondary/20 rounded-xl text-secondary font-semibold text-lg hover:bg-secondary hover:text-white transition-all hover:border-secondary hover:scale-105 shadow-sm"
                            >
                                <span>{rs.title}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
            <WhatsAppButton />

            {/* Calendly Modal */}
            <CalendlyModal
                isOpen={isCalendlyOpen}
                onClose={() => setIsCalendlyOpen(false)}
                calendlyUrl={calendlyUrl}
            />
        </main>
    );
}
