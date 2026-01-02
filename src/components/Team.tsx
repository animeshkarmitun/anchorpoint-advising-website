'use client';

import { motion } from 'framer-motion';
import { User, Mail, Phone, Linkedin, Twitter, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Expart from '@/assets/icons/Expart';
import Image from 'next/image';

export default function Team() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { language } = useLanguage();

    // Inline translations
    const translations = {
        bn: {
            badge: "বিশেষজ্ঞদের সাথে দেখা করুন",
            title1: "আমাদের",
            title2: "বিশেষজ্ঞ দল",
            subtitle: "আপনার সাফল্যের জন্য প্রতিশ্রুতিবদ্ধ আমাদের প্রত্যয়িত ট্যাক্স পেশাদারদের দলের সাথে পরিচিত হন",
            members: [
                {
                    name: "লাল্টু লাল সরকার (প্রদীপ)",
                    role: "এফসিজিএ কনসালট্যান্টস-ভ্যাট, কাস্টমস, আয়কর, হিসাব, ​​অডিট কোম্পানি বিষয়ক",
                    expertise: "এম.কম, এমবিএ, আইটিপি, সিএ (আরএটি) এবং সিএফও (সিওএল)",
                    image: "/team/Laltu.jpg"
                },
                {
                    name: "মোঃ রুহুল আমিন তামিম",
                    role: "সিনিয়র ট্যাক্স উপদেষ্টা",
                    expertise: "প্রধান পরামর্শদাতা",
                    image: "/team/tamim.jpg"
                },
                {
                    name: "রাদিয়া ইউসুফ",
                    role: "ট্যাক্স সমাধান বিশেষজ্ঞ",
                    expertise: "অফিসার, ঢাকা ব্যাংক",
                    image: "/team/Radya Yousuf.jpg"
                },
                // {
                //     name: "অ্যান্ড্রু প্যাটেল",
                //     role: "ব্যবসায়িক ট্যাক্স বিশেষজ্ঞ",
                //     expertise: "সিপিএ প্রত্যয়িত",
                //     image: "/team/tam.jpg"
                // }
            ]
        },
        en: {
            badge: "MEET WITH EXPERT",
            title1: "Our",
            title2: "Expert Team",
            subtitle: "Meet our dedicated team of certified tax professionals committed to your success",
            members: [
                {
                    name: "Laltu Lal Sarker (Prodip)",
                    role: "FCGA Consultants-VAT, Customs, Income Tax, Accounts, Audit Company Affairs",
                    expertise: "M.Com, MBA, ITP, CA (RAT) & CFO (COL)",
                    image: "/team/Laltu.jpg"
                },
                {
                    name: "Md. Ruhul Amin Tamim",
                    role: "Business Tax Expert",
                    expertise: "CPA Certified",
                    image: "/team/tamim.jpg"
                },
                {
                    name: "Radya Yousuf",
                    role: "Tax Resolution Specialist",
                    expertise: "Officer, Dhaka Bank",
                    image: "/team/Radya Yousuf.jpg"
                },
                // {
                //     name: "Andrew Patel",
                //     role: "Senior Tax Advisor",
                //     expertise: "Lead Consultant",
                //     image: "/team/tam.jpg"
                // }
            ]
        }
    };

    const t = translations[language];

    const teamMembers = t.members.map((member, index) => ({
        ...member,
        color: ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-green-500 to-green-700', 'from-orange-500 to-orange-700'][index]
    }));

    return (
        <section id="team" className="relative py-24 bg-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #3B82F6 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-20">

                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-bold tracking-widest uppercase text-sm mb-4 rounded-full"
                    >
                        {/* <Expart className="w-4 h-4" /> */}
                        {t.badge}
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-6xl font-bold text-[#1E3A8A] mb-6"
                    >
                        {t.title1}{" "}
                        <span className="text-secondary">
                            {t.title2}
                        </span>

                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed"
                    >
                        {t.subtitle}
                    </motion.p>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15, duration: 0.6 }}
                            onHoverStart={() => setHoveredIndex(index)}
                            onHoverEnd={() => setHoveredIndex(null)}
                            className="group relative w-full max-w-sm"
                        >
                            {/* Card Container */}
                            <motion.div
                                whileHover={{ y: -15 }}
                                className="relative glass-card rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-lg transition-all duration-500"
                            >
                                {/* Image/Avatar Section */}
                                <div className="relative h-120 overflow-hidden">
                                    {/* Team Member Image */}
                                    <motion.div
                                        animate={{
                                            scale: hoveredIndex === index ? 1.1 : 1,
                                        }}
                                        transition={{ duration: 0.6 }}
                                        className="relative w-full h-full"
                                    >
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        />

                                        {/* Gradient Overlay */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-20 mix-blend-multiply`} />

                                        {/* Sparkle Decoration */}
                                        <motion.div
                                            initial={{ scale: 0, rotate: 0 }}
                                            animate={{
                                                scale: hoveredIndex === index ? 1 : 0,
                                                rotate: hoveredIndex === index ? 180 : 0,
                                            }}
                                            className="absolute top-4 right-4 z-10"
                                        >
                                            <Sparkles className="w-8 h-8 text-[#F59E0B]" />
                                        </motion.div>
                                    </motion.div>

                                    {/* Social Links Overlay */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: hoveredIndex === index ? 1 : 0,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 bg-gradient-to-t from-[#0B1B35] via-[#1E3A8A]/90 to-transparent flex items-center justify-center space-x-4"
                                    >
                                        {[
                                            { icon: Linkedin, href: '#' },
                                            { icon: Twitter, href: '#' },
                                            { icon: Mail, href: '#' },
                                        ].map((social, i) => (
                                            <motion.a
                                                key={i}
                                                href={social.href}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{
                                                    y: hoveredIndex === index ? 0 : 20,
                                                    opacity: hoveredIndex === index ? 1 : 0,
                                                }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ scale: 1.2, rotate: 5 }}
                                                className="w-12 h-12 glass rounded-full flex items-center justify-center text-white hover:bg-[#F59E0B] transition-all duration-300"
                                            >
                                                <social.icon className="w-6 h-6" />
                                            </motion.a>
                                        ))}
                                    </motion.div>

                                    {/* Expertise Badge */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{
                                                y: hoveredIndex === index ? 0 : 20,
                                                opacity: hoveredIndex === index ? 1 : 0,
                                            }}
                                            className="glass px-4 py-2 rounded-full text-white text-sm font-semibold text-center"
                                        >
                                            {member.expertise}
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 text-center bg-white">
                                    <h3 className="text-xl font-bold text-[#1E3A8A] mb-2 group-hover:text-gradient transition-all duration-300">
                                        {member.name}
                                    </h3>
                                    <p className="text-gray-600 font-medium">{member.role}</p>
                                </div>

                                {/* Decorative Corner Glow */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500 rounded-full`} />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
