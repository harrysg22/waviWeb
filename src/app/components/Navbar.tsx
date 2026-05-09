import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '/#home' },
    { name: 'Nosotros', href: '/#about' },
    { name: 'Descargar App', href: '/#download' },
    { name: 'Experiencias', href: '/#experiences' },
    { name: 'Beneficios', href: '/#benefits' },
    { name: 'Contacto', href: '/#contact' },
    { name: 'Términos y condiciones', href: '/terminos-y-condiciones' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link to="/#home" className="flex items-center gap-2 group">
          <Logo size="md" className="transition-transform group-hover:scale-105" />
          <span className="font-bold text-xl tracking-tight hidden sm:block">WAVI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href}
              className="text-sm font-medium text-gray-600 hover:text-wavi-blue transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link 
            to="/#wavi-business" 
            className="flex items-center gap-2 text-sm font-semibold text-wavi-blue border border-wavi-blue/30 hover:border-wavi-blue hover:bg-wavi-blue/5 px-4 py-2 rounded-full transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-wavi-blue inline-block"></span>
            WAVI Business
          </Link>
          <Link to="/#download" className="bg-wavi-blue hover:bg-wavi-blue-dark text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg">
            Descargar App
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-gray-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.href}
                  className="text-base font-medium text-gray-800 py-2 border-b border-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link 
                to="/#wavi-business" 
                className="flex items-center gap-2 text-base font-bold text-wavi-blue py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-2 h-2 rounded-full bg-wavi-blue inline-block"></span>
                Descargar WAVI Business
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};