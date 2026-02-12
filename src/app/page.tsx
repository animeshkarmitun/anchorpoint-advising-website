import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Consultation from "@/components/Consultation";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Team from "@/components/Team";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import DynamicSEO from "@/components/DynamicSEO";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <DynamicSEO />
      <Navbar />
      <Hero />
      <VideoSection />
      <Services />
      <About />
      <Stats />
      <Team />
      <Consultation />
      <Pricing />
      {/* <Testimonials /> */}
      <FAQ />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
