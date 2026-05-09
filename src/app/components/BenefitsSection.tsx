import React from 'react';
import { motion } from 'motion/react';
import { Zap, Gift, Sparkles, Compass, Users, Crown } from 'lucide-react';

export const BenefitsSection = () => {
  const benefits = [
    { icon: <Zap className="w-6 h-6" />, title: "Reservas Instantáneas", desc: "Sin llamadas ni esperas. Tu mesa lista en un par de toques." },
    { icon: <Gift className="w-6 h-6" />, title: "Recompensas Exclusivas", desc: "Gana puntos WAVI por cada salida y canjéalos por beneficios." },
    { icon: <Sparkles className="w-6 h-6" />, title: "Recomendaciones Inteligentes", desc: "Descubre lugares curados específicamente para tus gustos." },
    { icon: <Users className="w-6 h-6" />, title: "Descubrimiento Social", desc: "Ve a dónde van tus amigos y planea salidas en grupo." },
    { icon: <Crown className="w-6 h-6" />, title: "Experiencias Premium", desc: "Acceso prioritario a eventos y cenas secretas." },
    { icon: <Compass className="w-6 h-6" />, title: "Adiós a la Rutina", desc: "Sal de tu burbuja y explora nuevos vecindarios y sabores." }
  ];

  return (
    <section id="benefits" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block py-1.5 px-4 rounded-full bg-wavi-blue/10 text-wavi-blue font-semibold text-sm mb-4 border border-wavi-blue/20">
            Beneficios
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Diseñado para <span className="text-wavi-blue">mejorar</span> tu estilo de vida.
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            No somos solo un directorio. Somos tu pasaporte a la mejor versión de tu ciudad.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-premium-hover transition-all duration-300 border border-gray-100 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-wavi-blue group-hover:text-white transition-colors duration-300 flex items-center justify-center text-wavi-blue mb-6">
                {b.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{b.title}</h3>
              <p className="text-gray-500 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};