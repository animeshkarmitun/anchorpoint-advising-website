"use client";

import ServicePageLayout from "@/components/ServicePageLayout";
import individualTaxContent from "@/content/en/individual-tax.json";

export default function IndividualTaxClient() {
    return <ServicePageLayout content={individualTaxContent} />;
}
