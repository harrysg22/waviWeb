import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans text-gray-900 bg-[#FAFAFA] min-h-screen flex flex-col selection:bg-wavi-blue selection:text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-6 container mx-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">Términos y Condiciones</h1>
          <div className="prose max-w-none text-gray-600">
            <p className="text-lg">aquí va terminos y condiciones</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};