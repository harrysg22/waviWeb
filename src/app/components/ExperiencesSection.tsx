import React from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Star } from 'lucide-react';

export const ExperiencesSection = () => {
  const experiences = [
    {
      title: "Cena de Autor",
      location: "Polanco",
      rating: "4.9",
      img: "https://images.unsplash.com/photo-1764265923426-4e550ccd1351?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwcmVzdGF1cmFudCUyMGRpbmluZyUyMGxpZmVzdHlsZXxlbnwxfHx8fDE3NzgyMjE3NTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      span: "md:col-span-2 md:row-span-2"
    },
    {
      title: "Rooftop Party",
      location: "Condesa",
      rating: "4.8",
      img: "https://images.unsplash.com/photo-1621275471769-e6aa344546d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29mdG9wJTIwYmFyJTIwcGFydHklMjBuaWdodHxlbnwxfHx8fDE3NzgyMjE3NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      span: "md:col-span-1 md:row-span-1"
    },
    {
      title: "Café de Especialidad",
      location: "Roma Norte",
      rating: "4.9",
      img: "https://images.unsplash.com/photo-1765045038226-43d7cd5cfd29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY2FmZSUyMGludGVyaW9yJTIwY29mZmVlfGVufDF8fHx8MTc3ODIyMTc1NHww&ixlib=rb-4.1.0&q=80&w=1080",
      span: "md:col-span-1 md:row-span-1"
    }
  ];

  return (
    <section id="experiences" className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Vive la ciudad <br/>como <span className="text-wavi-blue">nunca antes.</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Desde las terrazas más exclusivas hasta los secretos mejor guardados. Explora una selección curada de los mejores lugares a tu alrededor.
            </p>
          </div>
          <button className="text-wavi-blue font-semibold hover:text-wavi-blue-dark transition-colors flex items-center gap-2 pb-2">
            Ver todas las experiencias &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-[300px_300px] gap-6">
          {experiences.map((exp, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-3xl overflow-hidden group cursor-pointer ${exp.span}`}
            >
              <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-gray-900/40 transition-colors duration-500 z-10"></div>
              <ImageWithFallback 
                src={exp.img} 
                alt={exp.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{exp.title}</h3>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <MapPin size={16} />
                      <span>{exp.location}</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-semibold">
                    <Star size={14} className="fill-white" />
                    <span>{exp.rating}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};