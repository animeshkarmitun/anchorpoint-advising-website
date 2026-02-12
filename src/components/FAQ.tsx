"use client";

import { useState, useMemo } from "react";
import { ChevronDown, HelpCircle, Search, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

export default function FAQ() {
    const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const { language } = useLanguage();
    const t = translations[language].faq;

    const toggleFAQ = (index: number) => {
        setOpenIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    // Filter FAQs based on search query
    const filteredFAQs = useMemo(() => {
        if (!searchQuery.trim()) return t.questions.map((faq: { question: string; answer: string }, i: number) => ({ ...faq, originalIndex: i }));
        const query = searchQuery.toLowerCase();
        return t.questions
            .map((faq: { question: string; answer: string }, i: number) => ({ ...faq, originalIndex: i }))
            .filter((faq: { question: string; answer: string }) =>
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query)
            );
    }, [searchQuery, t.questions]);

    const allExpanded = filteredFAQs.length > 0 && filteredFAQs.every((faq: { originalIndex: number }) => openIndices.has(faq.originalIndex));

    const toggleAll = () => {
        if (allExpanded) {
            setOpenIndices(new Set());
        } else {
            const allIndices = new Set(filteredFAQs.map((faq: { originalIndex: number }) => faq.originalIndex));
            setOpenIndices(allIndices);
        }
    };

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex justify-center mb-6"
                    >
                        <span className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                            <HelpCircle size={16} />
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
                        className="text-gray-600 text-center text-lg mb-10 max-w-3xl mx-auto leading-relaxed"
                    >
                        {t.subtitle}
                    </motion.p>

                    {/* Search Bar + Expand/Collapse */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25 }}
                        className="flex flex-col sm:flex-row items-center gap-3 mb-8"
                    >
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={language === "bn" ? "প্রশ্ন খুঁজুন..." : "Search questions..."}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Expand/Collapse Toggle */}
                        <button
                            onClick={toggleAll}
                            className="inline-flex items-center gap-2 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-primary transition-all whitespace-nowrap"
                        >
                            {allExpanded ? (
                                <>
                                    <ChevronsDownUp size={18} />
                                    {language === "bn" ? "সব বন্ধ করুন" : "Collapse All"}
                                </>
                            ) : (
                                <>
                                    <ChevronsUpDown size={18} />
                                    {language === "bn" ? "সব খুলুন" : "Expand All"}
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* Results count when searching */}
                    {searchQuery && (
                        <p className="text-sm text-gray-500 mb-4">
                            {language === "bn"
                                ? `${filteredFAQs.length}টি প্রশ্ন পাওয়া গেছে`
                                : `${filteredFAQs.length} question${filteredFAQs.length !== 1 ? "s" : ""} found`
                            }
                        </p>
                    )}

                    {/* FAQ Accordion */}
                    <div className="space-y-4">
                        {filteredFAQs.map((faq: { question: string; answer: string; originalIndex: number }, displayIndex: number) => (
                            <motion.div
                                key={faq.originalIndex}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.05 * displayIndex }}
                                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                {/* Question Button */}
                                <button
                                    onClick={() => toggleFAQ(faq.originalIndex)}
                                    className={`w-full px-6 py-5 flex items-center gap-4 text-left transition-colors ${openIndices.has(faq.originalIndex) ? "bg-primary/5" : "hover:bg-gray-50"
                                        }`}
                                >
                                    {/* Numbered Badge */}
                                    <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${openIndices.has(faq.originalIndex)
                                            ? "bg-secondary text-white shadow-lg"
                                            : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {String(faq.originalIndex + 1).padStart(2, "0")}
                                    </span>

                                    <span className={`text-lg font-semibold flex-1 pr-2 transition-colors ${openIndices.has(faq.originalIndex) ? "text-primary" : "text-gray-800"
                                        }`}>
                                        {faq.question}
                                    </span>

                                    <motion.div
                                        animate={{ rotate: openIndices.has(faq.originalIndex) ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex-shrink-0"
                                    >
                                        <ChevronDown className={`transition-colors ${openIndices.has(faq.originalIndex) ? "text-secondary" : "text-gray-400"
                                            }`} size={24} />
                                    </motion.div>
                                </button>

                                {/* Answer */}
                                <AnimatePresence>
                                    {openIndices.has(faq.originalIndex) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 pt-2 ml-14">
                                                <div className="text-gray-600 leading-relaxed whitespace-pre-line border-l-2 border-secondary/20 pl-4">
                                                    {faq.answer}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    {/* No results message */}
                    {searchQuery && filteredFAQs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <Search className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 text-lg">
                                {language === "bn"
                                    ? "কোনো প্রশ্ন পাওয়া যায়নি। অন্য কিছু লিখে চেষ্টা করুন।"
                                    : "No questions found. Try a different search term."
                                }
                            </p>
                        </motion.div>
                    )}

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="text-center mt-16 p-10 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl"
                    >
                        <h3 className="text-2xl font-bold text-primary mb-2">
                            {t.ctaTitle}
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                            {t.ctaSubtitle}
                        </p>
                        <a
                            href="#consultation"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-white font-bold text-lg rounded-full hover:bg-secondary/90 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                        >
                            {t.ctaButton}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
