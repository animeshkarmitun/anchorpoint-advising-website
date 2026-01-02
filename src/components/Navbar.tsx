"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import CalendlyModal from "./CalendlyModal";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language].navbar;

    // Calendly URL
    const calendlyUrl = "https://calendly.com/anchorpointadvising/30min";

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: t.home, href: "/" },
        { name: t.about, href: "#about" },
        { name: t.services, href: "#services" },
        { name: t.testimonials, href: "#testimonials" },
        { name: t.contact, href: "#footer" },
    ];

    return (
        <>
            <nav
                className={clsx(
                    "fixed w-full z-50 transition-all duration-500",
                    isScrolled
                        ? "bg-white/80 backdrop-blur-xl shadow-xl py-4 border-b border-gray-100"
                        : "bg-transparent py-4"
                )}
            >
                <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
                    {/* Logo with Premium Effect */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-secondary rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative">
                                <Image
                                    src="/logo/transparent-logo.png"
                                    alt={t.logo}
                                    width={300}
                                    height={100}
                                    className="h-12 md:h-20 w-auto transition-transform group-hover:scale-105"
                                    priority
                                />
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={clsx(
                                    "font-medium text-base transition-all relative group",
                                    isScrolled
                                        ? "text-gray-700 hover:text-secondary"
                                        : "text-white/90 hover:text-white"
                                )}
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary group-hover:w-full transition-all duration-300" />
                            </Link>
                        ))}

                        {/* Language Toggle Button */}
                        <button
                            onClick={toggleLanguage}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                                isScrolled
                                    ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                                    : "bg-white/10 text-white hover:bg-white/20"
                            )}
                            aria-label="Toggle Language"
                        >
                            <Globe size={18} />
                            <span>{language === "bn" ? "বাং" : "EN"}</span>
                        </button>

                        {/* Strategy Call Button */}
                        <button
                            onClick={() => setIsCalendlyOpen(true)}
                            className="relative px-8 py-3 bg-secondary text-white rounded-xl font-semibold text-base transition-all shadow-lg hover:shadow-2xl hover:scale-105 hover:bg-secondary/90"
                        >
                            <span className="relative z-10">{t.strategyCall}</span>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={clsx(
                            "lg:hidden transition-colors",
                            isScrolled ? "text-primary" : "text-white"
                        )}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 overflow-hidden shadow-2xl"
                        >
                            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className="text-gray-700 hover:text-secondary font-medium py-3 block transition-colors border-b border-gray-100 last:border-0"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                {/* Language Toggle in Mobile */}
                                <button
                                    onClick={() => {
                                        toggleLanguage();
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary/10 text-secondary rounded-xl font-semibold text-center w-full transition-colors hover:bg-secondary/20"
                                >
                                    <Globe size={20} />
                                    <span>{language === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}</span>
                                </button>

                                {/* Strategy Call Button in Mobile */}
                                <button
                                    onClick={() => {
                                        setIsCalendlyOpen(true);
                                        setIsOpen(false);
                                    }}
                                    className="bg-secondary text-white px-6 py-4 rounded-xl font-semibold text-center w-full block mt-2 shadow-lg hover:bg-secondary/90 transition-colors"
                                >
                                    {t.strategyCall}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Calendly Modal */}
            <CalendlyModal
                isOpen={isCalendlyOpen}
                onClose={() => setIsCalendlyOpen(false)}
                calendlyUrl={calendlyUrl}
            />
        </>
    );
}
