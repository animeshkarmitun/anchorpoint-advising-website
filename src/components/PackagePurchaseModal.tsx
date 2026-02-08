"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

interface PackagePurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageType: 'consultation' | 'solution';
    packagePrice: number;
}

export default function PackagePurchaseModal({ isOpen, onClose, packageType, packagePrice }: PackagePurchaseModalProps) {
    const { language } = useLanguage();
    const t = translations[language].pricing;
    const [currentStep, setCurrentStep] = useState(1); // 1 = Details, 2 = Payment
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleContinue = () => {
        if (currentStep === 1) {
            // Validate form before moving to payment
            // Email is now optional, Age and Occupation removed
            if (formData.name && formData.phone) {
                setCurrentStep(2);
                setError(null);
            } else {
                setError(language === 'bn' ? 'সব ফিল্ড পূরণ করুন' : 'Please fill all fields');
            }
        }
    };

    const handlePayment = async () => {
        // Validate Payment Fields
        if (!formData.bkashNumber || !formData.transactionId) {
            setError(language === 'bn' ? 'অনুগ্রহ করে বিকাশ নম্বর এবং ট্রানজেকশন আইডি প্রদান করুন' : 'Please provide Bkash number and Transaction ID');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Call API to save customer data directly
            const response = await fetch('/api/save-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    amount: packagePrice,
                    packageType: packageType,
                    status: 'Pending Verification' // Updated status for manual check
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Success - Close modal and maybe show success message (handled by parent or alert for now)
                alert(language === 'bn' ? 'পেমেন্ট তথ্য সফলভাবে জমা দেওয়া হয়েছে!' : 'Payment info submitted successfully!');
                handleClose();
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
            setCurrentStep(1);
            setFormData({ name: "", email: "", phone: "", bkashNumber: "", transactionId: "" });
            setError(null);
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
                                {/* Instruction Message */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-8 relative">
                                    <p className="text-gray-700 text-lg leading-relaxed">
                                        {language === 'bn'
                                            ? 'অনুগ্রহ করে নিচের নম্বরে সেন্ড মানি করুন অথবা QR কোড স্ক্যান করুন এবং ফর্মটি পূরণ করুন:'
                                            : 'Please Send Money to the number below or scan the QR code, then fill out the form:'}
                                    </p>
                                </div>

                                {/* Stepper - Only 2 steps now */}
                                <div className="flex items-center justify-center mb-12">
                                    <div className="flex items-center gap-8 md:gap-16">
                                        {/* Step 1 - Details */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 ${currentStep === 1 ? 'bg-secondary' : 'bg-green-500'
                                                }`}>
                                                {currentStep > 1 ? '✓' : '1'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {language === 'bn' ? 'বিবরণ' : 'Details'}
                                            </span>
                                        </div>

                                        {/* Connector Line */}
                                        <div className={`w-24 md:w-32 h-1 ${currentStep === 2 ? 'bg-secondary' : 'bg-gray-200'}`}></div>

                                        {/* Step 2 - Payment */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${currentStep === 2 ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                2
                                            </div>
                                            <span className={`text-sm font-medium ${currentStep === 2 ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {language === 'bn' ? 'পেমেন্ট' : 'Payment'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Step Content */}
                                <AnimatePresence mode="wait">
                                    {currentStep === 1 ? (
                                        // Details Form
                                        <motion.div
                                            key="details"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-8"
                                        >
                                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                                {language === 'bn' ? 'আপনার বিবরণ' : 'Your Details'}
                                            </h2>

                                            <div className="space-y-6">
                                                {/* Name */}
                                                <div>
                                                    <label className="block text-gray-700 font-semibold mb-2">
                                                        {language === 'bn' ? 'নাম' : 'Name'} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-secondary focus:outline-none transition-colors"
                                                        placeholder={language === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'}
                                                        required
                                                    />
                                                </div>

                                                {/* Email (Optional) */}
                                                <div>
                                                    <label className="block text-gray-700 font-semibold mb-2">
                                                        {language === 'bn' ? 'ইমেইল' : 'Email'} <span className="text-gray-400 text-sm font-normal">({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-secondary focus:outline-none transition-colors"
                                                        placeholder={language === 'bn' ? 'আপনার ইমেইল ঠিকানা' : 'Your email address'}
                                                    />
                                                </div>



                                                {/* Phone Number */}
                                                <div>
                                                    <label className="block text-gray-700 font-semibold mb-2">
                                                        {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-secondary focus:outline-none transition-colors"
                                                        placeholder={language === 'bn' ? 'আপনার ফোন নম্বর' : 'Your phone number'}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Error Message */}
                                            {error && currentStep === 1 && (
                                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                                                    {error}
                                                </div>
                                            )}

                                            {/* Continue Button */}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleContinue}
                                                className="w-full bg-secondary text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-secondary/90"
                                            >
                                                {language === 'bn' ? 'চালিয়ে যান' : 'Continue'}
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        // Payment Section
                                        <motion.div
                                            key="payment"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                                {language === 'bn' ? 'পেমেন্ট করুন' : 'Make payment'}
                                            </h2>

                                            {/* Payment Summary */}
                                            <div className="space-y-6">
                                                <h3 className="text-2xl font-bold text-gray-800">
                                                    {language === 'bn' ? 'পেমেন্ট সারাংশ' : 'Payment summary'}
                                                </h3>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                                        <span className="text-gray-600 text-lg">
                                                            {packageType === 'consultation'
                                                                ? (language === 'bn' ? 'বিশেষজ্ঞ পরামর্শ' : 'Expert Consultation')
                                                                : (language === 'bn' ? 'সম্পূর্ণ ট্যাক্স সমাধান' : 'Complete Tax Solution')
                                                            }
                                                        </span>
                                                        <span className="text-gray-800 font-semibold text-lg">
                                                            {language === 'bn'
                                                                ? `${packagePrice.toLocaleString('bn-BD')} টাকা`
                                                                : `${packagePrice} BDT`
                                                            }
                                                        </span>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Payment Method - Bkash Instructions */}
                                            <div className="space-y-4">

                                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">

                                                    {/* bKash Merchant Number - Prominent Display */}
                                                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-4 mb-5 text-center">
                                                        <p className="text-pink-100 text-sm font-medium mb-1">
                                                            {language === 'bn' ? 'বিকাশ মার্চেন্ট নম্বর' : 'bKash Merchant Number'}
                                                        </p>
                                                        <p className="text-white text-3xl md:text-4xl font-bold tracking-widest">
                                                            01400966833
                                                        </p>
                                                    </div>

                                                    {/* bKash QR Code Image */}
                                                    <div className="flex justify-center my-4">
                                                        <div className="relative rounded-2xl overflow-hidden border-2 border-pink-200 shadow-md bg-white p-2">
                                                            <Image
                                                                src="/bkash-image.jpeg"
                                                                alt="bKash QR Code"
                                                                width={260}
                                                                height={260}
                                                                className="rounded-xl object-contain"
                                                                priority
                                                            />
                                                        </div>
                                                    </div>


                                                    <div className="space-y-4">
                                                        {/* Bkash Number Field */}
                                                        <div>
                                                            <label className="block text-gray-700 font-semibold mb-2">
                                                                {language === 'bn' ? 'বিকাশ নম্বর' : 'Bkash Number'} <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                name="bkashNumber"
                                                                value={formData.bkashNumber}
                                                                onChange={handleInputChange}
                                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-secondary focus:outline-none transition-colors"
                                                                placeholder={language === 'bn' ? 'আপনার বিকাশ নম্বর' : 'Your Bkash Number'}
                                                                required
                                                            />
                                                        </div>

                                                        {/* Transaction ID Field */}
                                                        <div>
                                                            <label className="block text-gray-700 font-semibold mb-2">
                                                                {language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'} <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="transactionId"
                                                                value={formData.transactionId}
                                                                onChange={handleInputChange}
                                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-secondary focus:outline-none transition-colors uppercase"
                                                                placeholder={language === 'bn' ? 'TrxID' : 'TrxID'}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Error Message */}
                                            {error && currentStep === 2 && (
                                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                                                    {error}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-4">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setCurrentStep(1)}
                                                    disabled={isProcessing}
                                                    className="w-1/3 bg-gray-200 text-gray-700 py-5 px-8 rounded-2xl font-bold text-lg hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {language === 'bn' ? 'পিছনে' : 'Back'}
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                                                    whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                                                    onClick={handlePayment}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-secondary text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-secondary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isProcessing && <Loader2 className="animate-spin" size={20} />}
                                                    {isProcessing
                                                        ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                                                        : (language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Payment')}
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
        , document.body
    );
}
