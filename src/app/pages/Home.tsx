import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { AboutUsSection } from '../components/AboutUsSection';
import { DownloadAppSection } from '../components/DownloadAppSection';
import { ExperiencesSection } from '../components/ExperiencesSection';
import { BenefitsSection } from '../components/BenefitsSection';
import { BusinessSection } from '../components/BusinessSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { FinalCTASection } from '../components/FinalCTASection';
import { Footer } from '../components/Footer';

export const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="font-sans text-gray-900 bg-[#FAFAFA] min-h-screen selection:bg-wavi-blue selection:text-white">
      <Navbar />
      <main>
        <HeroSection />
        <AboutUsSection />
        <DownloadAppSection />
        <ExperiencesSection />
        <BenefitsSection />
        <BusinessSection />
        <TestimonialsSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};