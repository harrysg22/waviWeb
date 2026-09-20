import React from 'react';
import { motion } from 'motion/react';
import { PhoneMockup } from './PhoneMockup';
import { Apple, Play } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen pt-32 pb-20 overflow-hidden flex items-center bg-gradient-premium">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-wavi-blue/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-wavi-blue/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Text Content */}
        <div className="flex-1 text-center lg:text-left pt-10 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-wavi-blue/10 text-wavi-blue font-semibold text-sm mb-6 border border-wavi-blue/20">
              La ciudad te espera
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
              Descubre experiencias <br className="hidden md:block"/>
              <span className="text-gradient">más allá de reservar.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              WAVI te ayuda a descubrir restaurantes, experiencias y momentos inolvidables mientras ganas recompensas por salir. Rompe tu rutina y reconecta con la vida.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <Apple size={24} />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-80 leading-none">Descárgalo en la</div>
                  <div className="font-semibold leading-none mt-1">App Store</div>
                </div>
              </button>
              
              <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1">
                <Play size={24} className="text-wavi-blue" />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 leading-none">Disponible en</div>
                  <div className="font-semibold leading-none mt-1">Google Play</div>
                </div>
              </button>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 font-medium">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <span>Únete a miles de exploradores</span>
            </div>
          </motion.div>
        </div>
        
        {/* Mockups */}
        <div className="flex-1 relative h-[600px] w-full flex justify-center items-center lg:justify-end perspective-1000">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative z-20 translate-x-10 lg:translate-x-0"
          >
            <PhoneMockup uiMockup />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
            animate={{ opacity: 1, scale: 0.9, x: -60, y: 40 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute z-10 hidden md:block"
          >
            <PhoneMockup uiMockup className="blur-[1px] opacity-60 brightness-90" />
          </motion.div>
          
          {/* Floating Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute top-20 left-0 lg:-left-10 z-30 glass-card p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              +50
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Recompensas</p>
              <p className="font-bold text-gray-900">Ganadas hoy</p>
            </div>
          </motion.div>
          
        </div>

      </div>
    </section>
  );
};