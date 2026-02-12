import type { Metadata } from "next";
import individualTaxContent from "@/content/en/individual-tax.json";
import ServicePageClient from "./client";

export const metadata: Metadata = {
    title: individualTaxContent.meta.title,
    description: individualTaxContent.meta.description,
};

export default function IndividualTaxPage() {
    return <ServicePageClient />;
}
