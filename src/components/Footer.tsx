"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Send, ArrowRight, CheckCircle } from "lucide-react";

const BrandIcon = ({ size = 24, ...props }: { size?: number | string } & React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />
);
const Facebook = (props: { size?: number | string } & React.SVGProps<SVGSVGElement>) => <BrandIcon {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></BrandIcon>;
const Twitter = (props: { size?: number | string } & React.SVGProps<SVGSVGElement>) => <BrandIcon {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></BrandIcon>;
const Instagram = (props: { size?: number | string } & React.SVGProps<SVGSVGElement>) => <BrandIcon {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></BrandIcon>;
const Linkedin = (props: { size?: number | string } & React.SVGProps<SVGSVGElement>) => <BrandIcon {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></BrandIcon>;
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

export default function Footer() {
    const { language } = useLanguage();
    const t = translations[language].footer;

    const quickLinks = [t.home, t.aboutUs, t.services, t.projects, t.contact];
    const serviceLinks = [t.taxPreparation, t.financialPlanning, t.auditingServices, t.payrollManagement];

    return (
        <footer id="footer" className="relative bg-primary text-white pt-24 pb-8 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Company Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <div className="relative">
                                <Image
                                    src="/logo/transparent-logo.png"
                                    alt={t.logo}
                                    width={300}
                                    height={100}
                                    className="h-12 md:h-20 w-auto transition-transform group-hover:scale-105"
                                />
                            </div>
                        </Link>
                        <p className="text-gray-300 mb-6 leading-relaxed text-base">
                            {t.description}
                        </p>
                        {/* Trust Bullets */}
                        {t.trustBullets && (
                            <ul className="space-y-2.5 mb-8">
                                {t.trustBullets.map((bullet: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2.5 text-gray-300 text-sm">
                                        <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex gap-3">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                                <motion.a
                                    key={index}
                                    href="#"
                                    whileHover={{ scale: 1.1, y: -3 }}
                                    className="w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-secondary flex items-center justify-center rounded-xl transition-all duration-300 border border-white/10"
                                >
                                    <Icon size={20} />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-secondary rounded-full" />
                            {t.quickLinks}
                        </h3>
                        <ul className="space-y-4">
                            {quickLinks.map((item, index) => (
                                <li key={item}>
                                    <Link href="#" className="group text-gray-300 hover:text-white transition-colors text-base flex items-center gap-2">
                                        <ArrowRight size={16} className="text-secondary group-hover:translate-x-1 transition-transform" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Services */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-accent rounded-full" />
                            {t.ourServices}
                        </h3>
                        <ul className="space-y-4">
                            {serviceLinks.map((item) => (
                                <li key={item}>
                                    <Link href="#" className="group text-gray-300 hover:text-white transition-colors text-base flex items-center gap-2">
                                        <ArrowRight size={16} className="text-accent group-hover:translate-x-1 transition-transform" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Legal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-secondary rounded-full" />
                            {t.legal}
                        </h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="#" className="group text-gray-300 hover:text-white transition-colors text-base flex items-center gap-2">
                                    <ArrowRight size={16} className="text-secondary group-hover:translate-x-1 transition-transform" />
                                    {t.termsAndConditions}
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="group text-gray-300 hover:text-white transition-colors text-base flex items-center gap-2">
                                    <ArrowRight size={16} className="text-secondary group-hover:translate-x-1 transition-transform" />
                                    {t.privacyPolicy}
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookie-policy" className="group text-gray-300 hover:text-white transition-colors text-base flex items-center gap-2">
                                    <ArrowRight size={16} className="text-secondary group-hover:translate-x-1 transition-transform" />
                                    {t.cookiePolicy}
                                </Link>
                            </li>
                        </ul>

                        {/* Contact Info */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-gray-300 text-base group cursor-pointer">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-secondary transition-all">
                                    <Mail size={20} className="text-secondary group-hover:text-white" />
                                </div>
                                <span>{t.email}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Copyright */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    <p className="text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} {t.copyright}
                    </p>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <Link href="#" className="hover:text-white transition-colors">{t.privacyPolicy}</Link>
                        <Link href="#" className="hover:text-white transition-colors">{t.termsOfService}</Link>
                        <Link href="/cookie-policy" className="hover:text-white transition-colors">{t.cookiePolicy}</Link>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
