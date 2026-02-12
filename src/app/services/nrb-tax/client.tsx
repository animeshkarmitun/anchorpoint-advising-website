"use client";

import ServicePageLayout from "@/components/ServicePageLayout";
import nrbTaxContent from "@/content/en/nrb-tax.json";

export default function NrbTaxClient() {
    return <ServicePageLayout content={nrbTaxContent} />;
}
