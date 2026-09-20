import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      text: "Gracias a WAVI descubrí lugares en mi propia ciudad que no sabía que existían. Además, las recompensas hacen que salir sea aún mejor.",
      name: "Laura G.",
      role: "Exploradora Urbana",
      img: "https://i.pravatar.cc/150?img=32"
    },
    {
      text: "Como dueña de restaurante, WAVI nos ha traído una clientela joven y dispuesta a probar cosas nuevas. El dashboard es súper fácil de usar.",
      name: "Mariana V.",
      role: "Propietaria de 'La Terraza'",
      img: "https://i.pravatar.cc/150?img=44"
    },
    {
      text: "La interfaz es increíblemente limpia y reservar es cuestión de dos toques. Se ha convertido en mi app favorita para los fines de semana.",
      name: "Carlos R.",
      role: "Usuario WAVI",
      img: "https://i.pravatar.cc/150?img=11"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Lo que dice nuestra <span className="text-wavi-blue">comunidad</span>.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex text-yellow-400 mb-6 gap-1">
                  {[1,2,3,4,5].map(star => <Star key={star} size={18} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-4">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-gray-900">{t.name}</h4>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center border-t border-gray-200 pt-12">
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">+50k</div>
            <div className="text-sm text-gray-500 font-medium">Usuarios Activos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">+200</div>
            <div className="text-sm text-gray-500 font-medium">Partners</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">4.9</div>
            <div className="text-sm text-gray-500 font-medium">Estrellas en App Store</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">10k+</div>
            <div className="text-sm text-gray-500 font-medium">Reservas Mensuales</div>
          </div>
        </div>
      </div>
    </section>
  );
};