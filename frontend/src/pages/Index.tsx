import { useState } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ProcessSteps from "@/components/ProcessSteps";
import Footer from "@/components/Footer";

const Index = () => {
  const handleTryClick = () => {
    const processSection = document.getElementById('process');
    if (processSection) {
      processSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection onTryClick={handleTryClick} />
      <ProcessSteps />
      <Footer />
    </div>
  );
};

export default Index;
