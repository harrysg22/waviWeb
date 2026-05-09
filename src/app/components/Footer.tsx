import React from 'react';
import { Logo } from './Logo';
import { Instagram, Twitter, Linkedin, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router';

export const Footer = () => {
  return (
    <footer className="bg-[#06080A] text-white border-t border-white/8">
      {/* Contact Section */}
      <div id="contact" className="border-b border-white/8 py-16">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block py-1.5 px-4 rounded-full bg-[#25B3CC]/15 text-[#25B3CC] font-semibold text-sm mb-5 border border-[#25B3CC]/30">
                Contacto
              </span>
              <h3 className="text-3xl font-bold mb-4">
                ¿Tienes preguntas? <br />
                <span className="text-[#25B3CC]">Estamos aquí.</span>
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                Ya sea que quieras saber más sobre WAVI o unirte como negocio partner,
                nuestro equipo está listo para ayudarte.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-[#25B3CC]" />
                  <span>hola@wavi.app</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-[#25B3CC]" />
                  <span>partners@wavi.app</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-[#25B3CC]" />
                  <span>Ciudad de México, México</span>
                </div>
              </div>
            </div>
            <div className="bg-white/4 border border-white/8 rounded-3xl p-8">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#25B3CC]/50 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Tu email"
                    className="bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#25B3CC]/50 transition-colors"
                  />
                </div>
                <select className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm focus:outline-none focus:border-[#25B3CC]/50 transition-colors appearance-none">
                  <option value="">¿En qué podemos ayudarte?</option>
                  <option value="user">Soy usuario WAVI</option>
                  <option value="business">Quiero registrar mi negocio</option>
                  <option value="press">Prensa / Media</option>
                  <option value="other">Otro</option>
                </select>
                <textarea
                  placeholder="Tu mensaje..."
                  rows={3}
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#25B3CC]/50 transition-colors resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(37,179,204,0.25)]"
                >
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="pt-14 pb-8">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <div>
                  <span className="font-bold text-xl tracking-tight">WAVI</span>
                  <span className="block text-[#25B3CC] text-xs">Urban Lifestyle Platform</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Tu plataforma de estilo de vida para descubrir experiencias urbanas, conectar y ganar recompensas.
              </p>
              {/* WAVI Business badge */}
              <div className="inline-flex items-center gap-2 bg-white/4 border border-white/10 rounded-full px-4 py-2">
                <div className="w-5 h-5 rounded-full bg-[#25B3CC] flex items-center justify-center">
                  <span className="text-white text-[6px] font-bold">W</span>
                </div>
                <span className="text-gray-400 text-xs">También disponible: <span className="text-[#25B3CC] font-semibold">WAVI Business</span></span>
              </div>
              <div className="flex gap-3 pt-1">
                <a href="#" className="w-9 h-9 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#25B3CC] hover:border-[#25B3CC]/30 transition-colors">
                  <Instagram size={15} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#25B3CC] hover:border-[#25B3CC]/30 transition-colors">
                  <Twitter size={15} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#25B3CC] hover:border-[#25B3CC]/30 transition-colors">
                  <Linkedin size={15} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">WAVI App</h4>
              <ul className="space-y-3">
                <li><Link to="/#about" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Sobre Nosotros</Link></li>
                <li><Link to="/#experiences" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Experiencias</Link></li>
                <li><Link to="/#benefits" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Beneficios WAVI</Link></li>
                <li><Link to="/#download" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Descargar App</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">WAVI Business</h4>
              <ul className="space-y-3">
                <li><Link to="/#wavi-business" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Descargar WAVI Business</Link></li>
                <li><Link to="/#wavi-business" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Para Restaurantes</Link></li>
                <li><Link to="/#wavi-business" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Dashboard & Analytics</Link></li>
                <li><Link to="/#contact" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Soporte Partners</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/terminos-y-condiciones" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Términos y Condiciones</Link></li>
                <li><Link to="/politica-de-privacidad" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Privacidad</Link></li>
                <li><a href="#" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Cookies</a></li>
                <li><Link to="/#contact" className="text-gray-500 hover:text-[#25B3CC] text-sm transition-colors">Contacto</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} WAVI. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25B3CC] inline-block"></span>
              <span className="text-xs text-gray-600">Hecho para la ciudad · WAVI & WAVI Business</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
