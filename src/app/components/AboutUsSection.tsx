import React from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Users } from 'lucide-react';

export const AboutUsSection = () => {
  const values = [
    {
      icon: <Compass className="w-6 h-6 text-wavi-blue" />,
      title: "Exploración",
      desc: "Sal de tu zona de confort y descubre rincones de la ciudad que no sabías que existían."
    },
    {
      icon: <Users className="w-6 h-6 text-wavi-blue" />,
      title: "Conexión",
      desc: "Comparte momentos con amigos y conoce personas a través de experiencias compartidas."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-wavi-blue" />,
      title: "Recompensas",
      desc: "Por cada reserva y experiencia vivida, acumula puntos para acceder a eventos exclusivos."
    }
  ];

  return (
    <section id="about" className="py-24 bg-white relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
          >
            La vida ocurre <span className="text-wavi-blue">afuera.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-500 leading-relaxed"
          >
            WAVI no es solo una app de reservas. Es un movimiento para dejar la rutina atrás. 
            Creemos que las mejores historias no se viven a través de una pantalla, sino en 
            esa terraza oculta, en ese café de especialidad, o en esa noche imprevista en la ciudad.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="bg-gray-50 rounded-[2rem] p-8 text-center hover:shadow-premium-hover transition-all duration-300 hover:-translate-y-2 border border-gray-100"
            >
              <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                {v.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
              <p className="text-gray-500 leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};