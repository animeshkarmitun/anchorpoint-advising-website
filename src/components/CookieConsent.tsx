"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const { language } = useLanguage();
    const t = translations[language].cookieConsent;

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem("cookie_consent");
        if (consent === null) {
            // Show banner after a short delay for smooth UX
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie_consent", "declined");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-5 md:p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            {/* Icon & Message */}
                            <div className="flex items-start gap-3 flex-1">
                                <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                    <Cookie size={20} className="text-secondary" />
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {t.message}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 md:flex-none px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                >
                                    {t.decline}
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold text-white bg-secondary hover:bg-secondary/90 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    {t.accept}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
