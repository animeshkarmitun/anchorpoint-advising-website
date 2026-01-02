"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function WhatsAppButton() {
    const [showTooltip, setShowTooltip] = useState(false);
    const { language } = useLanguage();
    const t = translations[language].whatsapp;

    const phoneNumber = "01820861115";
    const whatsappUrl = `https://wa.me/${phoneNumber}`;

    const handleClick = () => {
        window.open(whatsappUrl, "_blank");
    };

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <motion.button
                onClick={handleClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Pulsing Background Effect */}
                <motion.div
                    className="absolute inset-0 bg-green-500 rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Main Button */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-2xl flex items-center justify-center hover:shadow-green-500/50 transition-shadow">
                    <MessageCircle size={32} className="text-white" strokeWidth={2} />
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap"
                        >
                            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium">
                                {t.tooltip}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                                    <div className="border-8 border-transparent border-l-gray-900" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
