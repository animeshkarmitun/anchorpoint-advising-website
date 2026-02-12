"use client";

import ServicePageLayout, { ServicePageContent } from "@/components/ServicePageLayout";
import individualTaxContent from "@/content/en/individual-tax.json";

export default function IndividualTaxClient() {
    return <ServicePageLayout content={individualTaxContent as ServicePageContent} />;
}
