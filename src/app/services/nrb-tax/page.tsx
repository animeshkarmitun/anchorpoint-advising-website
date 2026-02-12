import type { Metadata } from "next";
import nrbTaxContent from "@/content/en/nrb-tax.json";
import ServicePageClient from "./client";

export const metadata: Metadata = {
    title: nrbTaxContent.meta.title,
    description: nrbTaxContent.meta.description,
};

export default function NrbTaxPage() {
    return <ServicePageClient />;
}
