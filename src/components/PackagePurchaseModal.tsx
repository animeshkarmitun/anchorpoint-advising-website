"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/content";

interface PackagePurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageType: 'consultation' | 'solution';
    packagePrice: number;
}

export default function PackagePurchaseModal({ isOpen, onClose, packageType, packagePrice }: PackagePurchaseModalProps) {
    const { language } = useLanguage();
    const t = translations[language].pricing;
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [useSameNumber, setUseSameNumber] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        name: "",
        phone: "",
        bkashNumber: "",
        transactionId: ""
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        bkashNumber: "",
        transactionId: ""
    });

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Auto-fill bKash number when checkbox is checked
    useEffect(() => {
        if (useSameNumber && formData.phone) {
            setFormData(prev => ({ ...prev, bkashNumber: prev.phone }));
        }
    }, [useSameNumber, formData.phone]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear field error when user starts typing
        setFieldErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(phone);
    };

    const validateTransactionId = (trxId: string): boolean => {
        return trxId.length >= 8 && /^[A-Z0-9]+$/.test(trxId);
    };

    const handlePhoneBlur = (field: 'phone' | 'bkashNumber') => {
        const value = formData[field];
        if (value && !validatePhone(value)) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: language === 'bn'
                    ? 'সঠিক ১১ ডিজিটের নম্বর লিখুন (01 দিয়ে শুরু)'
                    : 'Enter valid 11-digit number (starts with 01)'
            }));
        }
    };

    const handleTransactionIdBlur = () => {
        const value = formData.transactionId;
        if (value && !validateTransactionId(value)) {
            setFieldErrors(prev => ({
                ...prev,
                transactionId: language === 'bn'
                    ? 'সঠিক ট্রানজেকশন আইডি লিখুন'
                    : 'Enter valid transaction ID'
            }));
        }
    };

    const copyMerchantNumber = async () => {
        try {
            await navigator.clipboard.writeText('01400966833');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handlePayment = async () => {
        // Validate all fields
        const errors = {
            name: "",
            phone: "",
            bkashNumber: "",
            transactionId: ""
        };

        if (!formData.name.trim()) {
            errors.name = language === 'bn' ? 'নাম প্রয়োজন' : 'Name is required';
        }

        if (!formData.phone) {
            errors.phone = language === 'bn' ? 'ফোন নম্বর প্রয়োজন' : 'Phone number is required';
        } else if (!validatePhone(formData.phone)) {
            errors.phone = language === 'bn'
                ? 'সঠিক ১১ ডিজিটের নম্বর লিখুন'
                : 'Enter valid 11-digit number';
        }

        if (!formData.bkashNumber) {
            errors.bkashNumber = language === 'bn' ? 'বিকাশ নম্বর প্রয়োজন' : 'bKash number is required';
        } else if (!validatePhone(formData.bkashNumber)) {
            errors.bkashNumber = language === 'bn'
                ? 'সঠিক ১১ ডিজিটের নম্বর লিখুন'
                : 'Enter valid 11-digit number';
        }

        if (!formData.transactionId) {
            errors.transactionId = language === 'bn' ? 'ট্রানজেকশন আইডি প্রয়োজন' : 'Transaction ID is required';
        } else if (!validateTransactionId(formData.transactionId)) {
            errors.transactionId = language === 'bn'
                ? 'সঠিক ট্রানজেকশন আইডি লিখুন'
                : 'Enter valid transaction ID';
        }

        setFieldErrors(errors);

        // Check if there are any errors
        if (Object.values(errors).some(err => err !== "")) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/save-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    amount: packagePrice,
                    packageType: packageType,
                    status: 'Pending Verification'
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                setError(data.error || (language === 'bn' ? 'তথ্য সংরক্ষণ করতে ব্যর্থ' : 'Failed to save information'));
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(language === 'bn' ? 'একটি ত্রুটি ঘটেছে' : 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (!isProcessing) {
            setFormData({ name: "", email: "", phone: "", bkashNumber: "", transactionId: "" });
            setError(null);
            setFieldErrors({ name: "", phone: "", bkashNumber: "", transactionId: "" });
            setUseSameNumber(false);
            setShowSuccess(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999]" style={{ isolation: 'isolate' }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        style={{ backdropFilter: 'blur(8px)' }}
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative pointer-events-auto"
                            style={{ isolation: 'isolate' }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 z-10 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>

                            {/* Modal Content */}
                            <div className="overflow-y-auto max-h-[90vh] p-6 md:p-8 bg-white relative z-[1]">
                                {showSuccess ? (
                                    // Success State
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-16"
                                    >
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                            <Check size={48} className="text-green-600" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">
                                            {language === 'bn' ? 'সফলভাবে জমা দেওয়া হয়েছে!' : 'Successfully Submitted!'}
                                        </h2>
                                        <p className="text-gray-600 text-center">
                                            {language === 'bn'
                                                ? 'আমরা যাচাই করে শীঘ্রই আপনার সাথে যোগাযোগ করব।'
                                                : "We'll verify and contact you soon."}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* Instruction Banner */}
                                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 mb-6">
                                            <p className="text-gray-700 leading-relaxed">
                                                {language === 'bn'
                                                    ? 'অনুগ্রহ করে নিচের নম্বরে সেন্ড মানি করুন অথবা QR কোড স্ক্যান করুন এবং ফর্মটি পূরণ করুন:'
                                                    : 'Please Send Money to the number below or scan the QR code, then fill out the form:'}
                                            </p>
                                        </div>

                                        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                                            {language === 'bn' ? 'পেমেন্ট করুন' : 'Complete Payment'}
                                        </h2>

                                        {/* bKash Merchant Number with Copy Button */}
                                        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-4 mb-4 text-center">
                                            <p className="text-pink-100 text-xs font-medium mb-1">
                                                {language === 'bn' ? 'বিকাশ মার্চেন্ট নম্বর' : 'bKash Merchant Number'}
                                            </p>
                                            <div className="flex items-center justify-center gap-3">
                                                <p className="text-white text-2xl md:text-3xl font-bold tracking-wider">
                                                    01400966833
                                                </p>
                                                <button
                                                    onClick={copyMerchantNumber}
                                                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                                                    title={language === 'bn' ? 'কপি করুন' : 'Copy'}
                                                >
                                                    {copied ? (
                                                        <Check size={20} className="text-white" />
                                                    ) : (
                                                        <Copy size={20} className="text-white" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* QR Code */}
                                        <div className="flex justify-center mb-6">
                                            <div className="relative rounded-2xl overflow-hidden border-2 border-pink-200 shadow-md bg-white p-2">
                                                <Image
                                                    src="/bkash-image.jpeg"
                                                    alt="bKash QR Code"
                                                    width={220}
                                                    height={220}
                                                    className="rounded-xl object-contain"
                                                    priority
                                                />
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="space-y-5">
                                            {/* Name */}
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                    {language === 'bn' ? 'নাম' : 'Name'} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${fieldErrors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-secondary'
                                                        }`}
                                                    placeholder={language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Your full name'}
                                                />
                                                {fieldErrors.name && (
                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                                                )}
                                            </div>

                                            {/* Email (Optional) */}
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                    {language === 'bn' ? 'ইমেইল' : 'Email'} <span className="text-gray-400 text-xs">({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-secondary focus:outline-none transition-colors"
                                                    placeholder={language === 'bn' ? 'আপনার ইমেইল' : 'Your email'}
                                                />
                                            </div>

                                            {/* Phone Number */}
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                    {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    onBlur={() => handlePhoneBlur('phone')}
                                                    inputMode="numeric"
                                                    maxLength={11}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${fieldErrors.phone ? 'border-red-300 focus:border-red-400' :
                                                        formData.phone && validatePhone(formData.phone) ? 'border-green-300 focus:border-green-400' :
                                                            'border-gray-200 focus:border-secondary'
                                                        }`}
                                                    placeholder={language === 'bn' ? '01XXXXXXXXX' : '01XXXXXXXXX'}
                                                />
                                                {fieldErrors.phone && (
                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                                                )}
                                            </div>

                                            {/* bKash Number */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-gray-700 font-semibold text-sm">
                                                        {language === 'bn' ? 'বিকাশ নম্বর' : 'bKash Number'} <span className="text-red-500">*</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={useSameNumber}
                                                            onChange={(e) => setUseSameNumber(e.target.checked)}
                                                            className="w-4 h-4 accent-secondary"
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            {language === 'bn' ? 'ফোন নম্বরের মতো' : 'Same as phone'}
                                                        </span>
                                                    </label>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="bkashNumber"
                                                    value={formData.bkashNumber}
                                                    onChange={handleInputChange}
                                                    onBlur={() => handlePhoneBlur('bkashNumber')}
                                                    inputMode="numeric"
                                                    maxLength={11}
                                                    disabled={useSameNumber}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${useSameNumber ? 'bg-gray-50' :
                                                        fieldErrors.bkashNumber ? 'border-red-300 focus:border-red-400' :
                                                            formData.bkashNumber && validatePhone(formData.bkashNumber) ? 'border-green-300 focus:border-green-400' :
                                                                'border-gray-200 focus:border-secondary'
                                                        }`}
                                                    placeholder={language === 'bn' ? '01XXXXXXXXX' : '01XXXXXXXXX'}
                                                />
                                                {fieldErrors.bkashNumber && (
                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.bkashNumber}</p>
                                                )}
                                            </div>

                                            {/* Transaction ID */}
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                    {language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="transactionId"
                                                    value={formData.transactionId}
                                                    onChange={(e) => {
                                                        const upper = e.target.value.toUpperCase();
                                                        setFormData(prev => ({ ...prev, transactionId: upper }));
                                                        setFieldErrors(prev => ({ ...prev, transactionId: "" }));
                                                    }}
                                                    onBlur={handleTransactionIdBlur}
                                                    maxLength={10}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors uppercase ${fieldErrors.transactionId ? 'border-red-300 focus:border-red-400' :
                                                        formData.transactionId && validateTransactionId(formData.transactionId) ? 'border-green-300 focus:border-green-400' :
                                                            'border-gray-200 focus:border-secondary'
                                                        }`}
                                                    placeholder="TRX123456"
                                                />
                                                {fieldErrors.transactionId && (
                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.transactionId}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Global Error Message */}
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mt-4">
                                                {error}
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <motion.button
                                            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                                            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                                            onClick={handlePayment}
                                            disabled={isProcessing}
                                            className="w-full bg-secondary text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-secondary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                                        >
                                            {isProcessing && <Loader2 className="animate-spin" size={20} />}
                                            {isProcessing
                                                ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                                                : (language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Payment')}
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
        , document.body
    );
}
