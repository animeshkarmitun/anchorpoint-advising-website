import type { Metadata } from "next";
import corporateTaxContent from "@/content/en/corporate-tax.json";
import ServicePageClient from "./client";

export const metadata: Metadata = {
    title: corporateTaxContent.meta.title,
    description: corporateTaxContent.meta.description,
};

export default function CorporateTaxPage() {
    return <ServicePageClient />;
}
