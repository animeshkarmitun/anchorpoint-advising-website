"use client";

import ServicePageLayout from "@/components/ServicePageLayout";
import corporateTaxContent from "@/content/en/corporate-tax.json";

export default function CorporateTaxClient() {
    return <ServicePageLayout content={corporateTaxContent} />;
}
