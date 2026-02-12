import type { Metadata } from "next";
import content from "@/content/en/tax-rebate-guide.json";
import ServicePageClient from "./client";

export const metadata: Metadata = {
    title: content.meta.title,
    description: content.meta.description,
};

export default function TaxRebateGuidePage() {
    return <ServicePageClient />;
}
