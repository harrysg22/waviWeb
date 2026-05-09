import React from 'react';
import { motion } from 'motion/react';
import { Apple, Play } from 'lucide-react';

export const FinalCTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-wavi-blue">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-white/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-[#198A9E]/40 rounded-full blur-[80px]"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Estás a un paso de tu <br className="hidden md:block"/>
            próxima gran historia.
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Descarga WAVI hoy, descubre experiencias exclusivas y empieza a ganar recompensas en tus lugares favoritos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              <Apple size={24} />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 leading-none">Descárgalo en la</div>
                <div className="font-semibold leading-none mt-1">App Store</div>
              </div>
            </button>
            
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              <Play size={24} className="text-wavi-blue" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider opacity-80 leading-none">Disponible en</div>
                <div className="font-semibold leading-none mt-1">Google Play</div>
              </div>
            </button>
          </div>
          
          <div className="pt-8 border-t border-white/20">
            <p className="text-white/80 font-medium">
              ¿Tienes un restaurante o negocio?{' '}
              <a href="#wavi-business" className="text-white font-bold underline decoration-2 underline-offset-4 hover:text-white/90">
                Únete con WAVI Business →
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};