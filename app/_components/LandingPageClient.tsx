"use client";

import { useRouter } from "next/navigation";
import Auth from "../../src/services/auth.module";
import Navbar from "../../src/components/landing/Navbar";
import Hero from "../../src/components/landing/Hero";
import DashboardMockups from "../../src/components/landing/DashboardMockups";
import ProblemSection from "../../src/components/landing/ProblemSection";
import HowItWorks from "../../src/components/landing/HowItWorks";
import FeaturesSection from "../../src/components/landing/FeaturesSection";
import EventsSection from "../../src/components/landing/EventsSection";
import UseCases from "../../src/components/landing/UseCases";
import CTASection from "../../src/components/landing/CTASection";
import Footer from "../../src/components/landing/Footer";

import PricingSection from "../../src/components/landing/PricingSection";

const LandingPageClient = () => {
  const router = useRouter();

  const scrollToHowItWorks = () => {
    const element = document.getElementById("how-it-works");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToUseCases = () => {
    const element = document.getElementById("use-cases");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPricing = () => {
    const element = document.getElementById("pricing");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGetStarted = () => {
    if (Auth.isUserAuthenticated()) {
      router.push("/create-event");
    } else {
      router.push("/sign-up");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans px-1 md:px-0 overflow-x-hidden w-full">
      <Navbar
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToUseCases={scrollToUseCases}
        scrollToFeatures={scrollToFeatures}
        scrollToPricing={scrollToPricing}
        onGetStarted={handleGetStarted}
      />
      <main className="relative w-full bg-white pb-32">
        <Hero
          scrollToHowItWorks={scrollToHowItWorks}
          onGetStarted={handleGetStarted}
        />
        <DashboardMockups />
      </main>
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <EventsSection />
      <UseCases />
      <PricingSection onGetStarted={handleGetStarted} />
      <CTASection
        onGetStarted={handleGetStarted}
        scrollToHowItWorks={scrollToHowItWorks}
      />
      <Footer
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToUseCases={scrollToUseCases}
        scrollToFeatures={scrollToFeatures}
      />
    </div>
  );
};

export default LandingPageClient;
