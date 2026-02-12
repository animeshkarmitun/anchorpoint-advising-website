"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const seoData = {
    bn: {
        title: "আয়কর রিটার্ন ফাইলিং বাংলাদেশ | অনলাইন NBR ই-রিটার্ন ও NRB সেবা",
        description:
            "বাংলাদেশে পেশাদার আয়কর রিটার্ন ফাইলিং সেবা। অনলাইন NBR ই-রিটার্ন, e-TIN, ট্যাক্স ক্যালকুলেশন ও NRB সাপোর্ট। নির্ভুল ও সময়মতো দাখিল।",
        lang: "bn",
    },
    en: {
        title: "Income Tax Filing Service in Bangladesh | Online NBR e-Return & NRB Support",
        description:
            "Professional income tax filing service in Bangladesh. Online NBR e-return, e-TIN registration, tax calculation & NRB tax support. File accurately & on time.",
        lang: "en",
    },
};

export default function DynamicSEO() {
    const { language } = useLanguage();

    useEffect(() => {
        const data = seoData[language];

        // Update <html lang> attribute
        document.documentElement.lang = data.lang;

        // Update <title>
        document.title = data.title;

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content", data.description);
        } else {
            metaDesc = document.createElement("meta");
            metaDesc.setAttribute("name", "description");
            metaDesc.setAttribute("content", data.description);
            document.head.appendChild(metaDesc);
        }
    }, [language]);

    return null;
}
