import React from 'react';
import { motion } from 'motion/react';
import { Search, Download, UserPlus, MapPin } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';

export const DownloadAppSection = () => {
  const steps = [
    { icon: <Search size={20} />, title: "Busca 'WAVI'", desc: "Encuéntranos en App Store o Google Play." },
    { icon: <Download size={20} />, title: "Descarga gratis", desc: "Instala la app en segundos." },
    { icon: <UserPlus size={20} />, title: "Crea tu perfil", desc: "Regístrate y personaliza tus gustos." },
    { icon: <MapPin size={20} />, title: "Empieza a explorar", desc: "Reserva y gana recompensas hoy." }
  ];

  return (
    <section id="download" className="py-24 bg-[#FAFAFA] overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 order-2 lg:order-1 relative flex justify-center perspective-1000">
             <div className="absolute inset-0 bg-gradient-to-tr from-wavi-blue/20 to-transparent rounded-full blur-3xl -z-10 w-3/4 h-3/4 m-auto"></div>
             <motion.div
               initial={{ rotateY: -15, opacity: 0, x: -50 }}
               whileInView={{ rotateY: 0, opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
             >
               <PhoneMockup uiMockup />
             </motion.div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Tu próxima aventura, <br/>
                <span className="text-wavi-blue">a un toque de distancia.</span>
              </h2>
              <p className="text-lg text-gray-500 mb-12 max-w-lg leading-relaxed">
                Únete a la comunidad de exploradores urbanos. Descubre lugares increíbles, reserva en segundos y obtén beneficios exclusivos en tus restaurantes favoritos.
              </p>

              <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-6 before:w-[2px] before:bg-gray-200">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative flex items-start gap-6"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-md border-2 border-wavi-blue flex items-center justify-center text-wavi-blue shrink-0 z-10 relative">
                      {step.icon}
                    </div>
                    <div className="pt-2 pb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-gray-500">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};