"use client";

import ServicePageLayout, { ServicePageContent } from "@/components/ServicePageLayout";
import content from "@/content/en/late-filing-guide.json";

export default function LateFilingGuideClient() {
    return <ServicePageLayout content={content as ServicePageContent} />;
}
