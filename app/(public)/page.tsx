import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import StatsSection from "@/components/landing/StatsSection";
import CTABanner from "@/components/landing/CTABanner";

/* ---------------------------------------------------------------
   Landing Page — app/(public)/page.tsx → renders at /
   Navbar and Footer are provided by the (public)/layout.tsx,
   so this file only contains landing-specific sections.
----------------------------------------------------------------*/

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <StatsSection />
      <CTABanner />
    </>
  );
}
