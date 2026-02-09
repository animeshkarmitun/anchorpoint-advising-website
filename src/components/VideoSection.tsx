"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

export default function VideoSection() {
    const { language } = useLanguage();
    const t = translations[language].video;

    // Replace this with your actual YouTube video ID
    // For example, if your YouTube URL is: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    // Then the videoId would be: dQw4w9WgXcQ
    const videoId = "YOUR_YOUTUBE_VIDEO_ID";
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

    return (
        <section className="py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex justify-center mb-6"
                    >
                        <span className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                            <Play size={16} />
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
                        className="text-gray-600 text-center text-lg mb-12 max-w-3xl mx-auto leading-relaxed"
                    >
                        {t.subtitle}
                    </motion.p>

                    {/* Video Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        {/* Video Wrapper with Premium Shadow */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500 bg-white p-2">
                            <div className="relative rounded-2xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={embedUrl}
                                    title={t.title1 + " " + t.title2}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
                    </motion.div>

                    {/* Optional: Key Points Below Video */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 grid md:grid-cols-3 gap-6"
                    >
                        {t.features.map((feature: string, index: number) => (
                            <div
                                key={index}
                                className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100"
                            >
                                <p className="text-gray-700 font-medium">{feature}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
