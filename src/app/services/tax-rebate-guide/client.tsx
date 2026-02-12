"use client";

import ServicePageLayout, { ServicePageContent } from "@/components/ServicePageLayout";
import content from "@/content/en/tax-rebate-guide.json";

export default function TaxRebateGuideClient() {
    return <ServicePageLayout content={content as ServicePageContent} />;
}
