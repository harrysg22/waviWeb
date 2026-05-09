import React from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PhoneMockupProps {
  delay?: number;
  className?: string;
  imageSrc?: string;
  uiMockup?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ delay = 0, className = '', imageSrc, uiMockup = false }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={`relative w-[280px] h-[580px] bg-white rounded-[40px] shadow-mockup border-[8px] border-gray-900 overflow-hidden shrink-0 ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-20"></div>
      
      {/* Screen Content */}
      <div className="relative w-full h-full bg-gray-50 overflow-hidden">
        {imageSrc ? (
          <ImageWithFallback src={imageSrc} alt="App UI" className="w-full h-full object-cover" />
        ) : uiMockup ? (
          <div className="w-full h-full flex flex-col">
            {/* Fake App Header */}
            <div className="pt-12 pb-4 px-5 bg-white shadow-sm flex justify-between items-center z-10">
              <div className="w-8 h-8 rounded-full bg-wavi-blue/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-wavi-blue"></div>
              </div>
              <div className="w-24 h-4 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-gray-100"></div>
            </div>
            
            {/* Fake Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 pb-20">
              <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-wavi-blue/20 to-wavi-blue/5 relative overflow-hidden">
                <div className="absolute bottom-4 left-4 space-y-2">
                  <div className="w-32 h-4 bg-white/80 rounded-full"></div>
                  <div className="w-20 h-3 bg-white/60 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-10 flex-1 bg-white rounded-xl shadow-sm border border-gray-100"></div>
                <div className="h-10 flex-1 bg-white rounded-xl shadow-sm border border-gray-100"></div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-16 h-16 rounded-lg bg-gray-200"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="w-3/4 h-3 bg-gray-200 rounded-full"></div>
                    <div className="w-1/2 h-2 bg-gray-100 rounded-full"></div>
                    <div className="w-1/4 h-2 bg-wavi-blue/50 rounded-full mt-2"></div>
                  </div>
                </div>
                <div className="flex gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-16 h-16 rounded-lg bg-gray-200"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="w-2/3 h-3 bg-gray-200 rounded-full"></div>
                    <div className="w-1/2 h-2 bg-gray-100 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fake Tabbar */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur border-t border-gray-100 flex justify-around items-center pb-4">
              <div className="w-6 h-6 rounded bg-wavi-blue"></div>
              <div className="w-6 h-6 rounded bg-gray-300"></div>
              <div className="w-10 h-10 rounded-full bg-wavi-blue/10 flex items-center justify-center">
                 <div className="w-5 h-5 rounded-full bg-wavi-blue"></div>
              </div>
              <div className="w-6 h-6 rounded bg-gray-300"></div>
              <div className="w-6 h-6 rounded bg-gray-300"></div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-wavi-blue/10 flex items-center justify-center">
            <span className="text-wavi-blue font-bold">WAVI UI</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};