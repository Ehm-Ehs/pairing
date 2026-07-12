"use client";

import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "../../src/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import Auth from "../../src/services/auth.module";
import { toast } from "react-toastify";
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

  const handleGetStarted = async () => {
    if (Auth.isUserAuthenticated()) {
      router.push("/create-event");
      return;
    }

    try {
      const toastId = toast.info("Setting up your guest session...", {
        position: "top-center",
        autoClose: false,
        isLoading: true,
      });

      const result = await signInAnonymously(auth);
      const user = result.user;

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userId = uuidv4();
        await setDoc(docRef, {
          userId,
          email: null,
          firstName: "Guest",
          lastName: "User",
          isAnonymous: true,
          createdAt: new Date().toISOString(),
          pairings: [],
        });
      }

      const accessToken = await user.getIdToken();
      if (accessToken && user) {
        const userToStore = {
          uid: user.uid,
          email: null,
          displayName: "Guest User",
          photoURL: null,
        };
        Auth.authenticateUser({ accessToken, data: userToStore });
        
        toast.update(toastId, {
          render: "Guest session ready!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

        router.push("/create-event");
      }
    } catch (error: any) {
      console.error("Error setting up guest session:", error);
      toast.error("Failed to setup guest session. Please try again.", {
        position: "top-center",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToUseCases={scrollToUseCases}
        scrollToFeatures={scrollToFeatures}
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
