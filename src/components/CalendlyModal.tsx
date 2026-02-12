"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";

interface CalendlyModalProps {
    isOpen: boolean;
    onClose: () => void;
    calendlyUrl: string;
}

export default function CalendlyModal({ isOpen, onClose, calendlyUrl }: CalendlyModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Build the Calendly URL with cookie consent if already accepted
    const getCalendlyUrl = () => {
        if (typeof window !== "undefined") {
            const consent = localStorage.getItem("cookie_consent");
            if (consent === "accepted") {
                const separator = calendlyUrl.includes("?") ? "&" : "?";
                return `${calendlyUrl}${separator}cookie_consent=1`;
            }
        }
        return calendlyUrl;
    };

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);

            // Load Calendly script
            const script = document.createElement("script");
            script.src = "https://assets.calendly.com/assets/external/widget.js";
            script.async = true;
            document.body.appendChild(script);

            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";

            // Listen for Calendly iframe ready
            const handleMessage = (e: MessageEvent) => {
                if (e.data?.event === "calendly.page_height" ||
                    e.data?.event === "calendly.event_type_viewed") {
                    setIsLoading(false);
                }
            };
            window.addEventListener("message", handleMessage);

            // Fallback: hide loader after 5s max
            const timeout = setTimeout(() => setIsLoading(false), 5000);

            return () => {
                document.body.style.overflow = "unset";
                window.removeEventListener("message", handleMessage);
                clearTimeout(timeout);
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

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-white">
                        <LogoLoader text="Loading scheduler" size={72} />
                    </div>
                )}

                {/* Calendly Inline Widget */}
                <div
                    className="calendly-inline-widget"
                    data-url={getCalendlyUrl()}
                    style={{ minWidth: "320px", height: "700px" }}
                />
            </div>
        </div>
    );
}
