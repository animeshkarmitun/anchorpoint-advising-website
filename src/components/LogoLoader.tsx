"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface LogoLoaderProps {
    text?: string;
    size?: number;
}

export default function LogoLoader({ text = "Loading...", size = 64 }: LogoLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-5">
            {/* Animated Logo Container */}
            <div className="relative">
                {/* Outer pulsing ring */}
                <motion.div
                    className="absolute inset-[-12px] rounded-full border-2 border-secondary/30"
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Inner rotating ring */}
                <motion.div
                    className="absolute inset-[-6px] rounded-full"
                    style={{
                        border: "2px solid transparent",
                        borderTopColor: "var(--color-secondary, #2563eb)",
                        borderRightColor: "var(--color-secondary, #2563eb)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Logo with pulse animation */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <Image
                        src="/logo/transparent-logo.png"
                        alt="Anchor Point"
                        width={size}
                        height={size}
                        className="rounded-full object-contain"
                        priority
                    />
                </motion.div>
            </div>

            {/* Animated dots text */}
            <div className="flex items-center gap-1">
                <span className="text-gray-500 font-medium text-sm">{text}</span>
                <motion.span
                    className="text-gray-500 font-medium text-sm"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    .
                </motion.span>
                <motion.span
                    className="text-gray-500 font-medium text-sm"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                    .
                </motion.span>
                <motion.span
                    className="text-gray-500 font-medium text-sm"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                >
                    .
                </motion.span>
            </div>
        </div>
    );
}
