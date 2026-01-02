"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface CalendlyModalProps {
    isOpen: boolean;
    onClose: () => void;
    calendlyUrl: string;
}

export default function CalendlyModal({ isOpen, onClose, calendlyUrl }: CalendlyModalProps) {
    useEffect(() => {
        if (isOpen) {
            // Load Calendly script
            const script = document.createElement("script");
            script.src = "https://assets.calendly.com/assets/external/widget.js";
            script.async = true;
            document.body.appendChild(script);

            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";

            return () => {
                document.body.style.overflow = "unset";
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X size={24} className="text-gray-700" />
                </button>

                {/* Calendly Inline Widget */}
                <div
                    className="calendly-inline-widget"
                    data-url={calendlyUrl}
                    style={{ minWidth: "320px", height: "700px" }}
                />
            </div>
        </div>
    );
}
