"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function Testimonials() {
    const { language } = useLanguage();
    const t = translations[language].testimonials;

    const testimonials = [
        {
            name: t.client1Name,
            role: t.client1Role,
            quote: t.client1Quote,
            rating: 5,
            image: "https://i.pravatar.cc/150?img=1",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            name: t.client2Name,
            role: t.client2Role,
            quote: t.client2Quote,
            rating: 5,
            image: "https://i.pravatar.cc/150?img=13",
            gradient: "from-purple-500 to-pink-500",
        },
        {
            name: t.client3Name,
            role: t.client3Role,
            quote: t.client3Quote,
            rating: 5,
            image: "https://i.pravatar.cc/150?img=5",
            gradient: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <section id="testimonials" className="py-28 bg-gray-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

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

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15, duration: 0.6 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer"
                        >
                            {/* Border Effect */}
                            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Quote Icon */}
                            <div className="absolute top-8 right-8 w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center">
                                <Quote className="text-white" size={40} />
                            </div>

                            <div className="relative z-10">
                                {/* Stars */}
                                <div className="flex gap-1 mb-6">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={20} className="fill-accent text-accent" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                                    "{testimonial.quote}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                                    <div className="relative">
                                        {/* Ring */}
                                        <div className="absolute inset-0 bg-secondary rounded-full blur-md opacity-50" />
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                                            <Image
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary text-lg">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
