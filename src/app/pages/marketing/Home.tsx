import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Navbar } from '../../components/marketing/Navbar';
import { HeroSection } from '../../components/marketing/HeroSection';
import { AboutUsSection } from '../../components/marketing/AboutUsSection';
import { DownloadAppSection } from '../../components/marketing/DownloadAppSection';
import { ExperiencesSection } from '../../components/marketing/ExperiencesSection';
import { BenefitsSection } from '../../components/marketing/BenefitsSection';
import { BusinessSection } from '../../components/marketing/BusinessSection';
import { TestimonialsSection } from '../../components/marketing/TestimonialsSection';
import { FinalCTASection } from '../../components/marketing/FinalCTASection';
import { Footer } from '../../components/marketing/Footer';

const Home = () => {
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

export default Home;