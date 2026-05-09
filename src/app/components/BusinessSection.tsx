import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Users, BarChart3, Calendar, Shield, Smartphone,
  Star, Bell, ChevronRight, Apple, Play, CheckCircle2,
  ArrowRight, Zap, Globe, Award, Download
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WaviBusinessModal } from './WaviBusinessModal';

/* ─── Dual Ecosystem Comparison ─────────────────────────────────────── */
const EcosystemCard = ({
  type,
  label,
  title,
  description,
  features,
  accent,
  dark,
}: {
  type: string;
  label: string;
  title: string;
  description: string;
  features: string[];
  accent: string;
  dark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`relative rounded-3xl p-8 border flex flex-col gap-6 overflow-hidden
      ${dark
        ? 'bg-[#0A0A0A] border-white/10'
        : 'bg-white border-gray-200'
      }`}
  >
    {/* Glow */}
    {dark && (
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#25B3CC]/20 rounded-full blur-[60px] pointer-events-none" />
    )}

    <div>
      <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4
        ${dark ? 'bg-[#25B3CC]/15 text-[#25B3CC] border border-[#25B3CC]/30' : 'bg-[#25B3CC]/10 text-[#25B3CC] border border-[#25B3CC]/20'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-[#25B3CC]' : 'bg-[#25B3CC]'} inline-block`}></span>
        {label}
      </span>
      <h3 className={`text-2xl font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
    </div>

    <ul className="space-y-2.5">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#25B3CC] shrink-0" />
          <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
        </li>
      ))}
    </ul>

    <div className={`mt-auto flex items-center gap-2 text-sm font-semibold cursor-pointer group
      ${dark ? 'text-[#25B3CC]' : 'text-[#25B3CC]'}`}>
      <span>{dark ? 'Descargar WAVI Business' : 'Descargar WAVI'}</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </motion.div>
);

/* ─── Fake Dashboard Mockup ──────────────────────────────────────────── */
const DashboardMockup = () => {
  const barData = [55, 72, 60, 85, 78, 92, 88];
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="bg-[#111318] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#25B3CC] flex items-center justify-center">
            <span className="text-white text-[7px] font-bold tracking-tight">WAVI</span>
          </div>
          <span className="text-white text-sm font-semibold">WAVI Business</span>
          <span className="text-[10px] text-[#25B3CC] bg-[#25B3CC]/15 px-2 py-0.5 rounded-full border border-[#25B3CC]/30 ml-1">Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#25B3CC] to-[#198A9E] flex items-center justify-center text-white text-[8px] font-bold">MR</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/8">
        {[
          { label: 'Reservas Hoy', value: '47', delta: '+8%', up: true },
          { label: 'Ingresos', value: '$2.4K', delta: '+12%', up: true },
          { label: 'Rating', value: '4.9', delta: '+0.2', up: true },
        ].map((s, i) => (
          <div key={i} className="bg-[#111318] px-4 py-3">
            <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
            <p className="text-white font-bold text-base">{s.value}</p>
            <p className={`text-[9px] font-medium ${s.up ? 'text-emerald-400' : 'text-red-400'}`}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-xs font-semibold">Reservas esta semana</span>
          <span className="text-[#25B3CC] text-[10px]">Ver detalle →</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {barData.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(h / 100) * 56}px`,
                  background: i === 5 ? '#25B3CC' : 'rgba(37,179,204,0.25)',
                }}
              />
              <span className="text-[8px] text-gray-600">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      <div className="px-5 pb-4 border-t border-white/8 pt-3">
        <p className="text-white text-xs font-semibold mb-3">Próximas Reservas</p>
        <div className="space-y-2">
          {[
            { name: 'Carlos M.', time: '20:00', guests: 4, status: 'confirmed' },
            { name: 'Ana García', time: '20:30', guests: 2, status: 'pending' },
            { name: 'Luis Torres', time: '21:00', guests: 6, status: 'confirmed' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-white/4 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#25B3CC]/20 flex items-center justify-center text-[#25B3CC] text-[7px] font-bold">
                  {r.name[0]}
                </div>
                <span className="text-white text-[10px] font-medium">{r.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[9px]">{r.time} · {r.guests} pers.</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium
                  ${r.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {r.status === 'confirmed' ? '✓' : '⏳'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Onboarding Step ────────────────────────────────────────────────── */
const OnboardingStep = ({
  step,
  icon,
  title,
  description,
  delay,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="relative flex flex-col items-center text-center group"
  >
    {/* Connector line */}
    {step < 4 && (
      <div className="hidden lg:block absolute left-1/2 top-8 w-full h-px border-t border-dashed border-[#25B3CC]/30 z-0" style={{ left: '50%' }} />
    )}

    <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#0E1419] border border-[#25B3CC]/30 flex items-center justify-center mb-4 group-hover:border-[#25B3CC] group-hover:shadow-[0_0_20px_rgba(37,179,204,0.2)] transition-all">
      <div className="text-[#25B3CC]">{icon}</div>
      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#25B3CC] text-white text-[10px] font-bold flex items-center justify-center">
        {step}
      </span>
    </div>
    <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
    <p className="text-gray-500 text-xs leading-relaxed max-w-[140px]">{description}</p>
  </motion.div>
);

/* ─── Analytics Floating Card ────────────────────────────────────────── */
const AnalyticsCard = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, x: -20 }}
    whileInView={{ opacity: 1, scale: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.4 }}
    className="bg-[#111318]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-48 shadow-2xl"
  >
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp className="w-4 h-4 text-[#25B3CC]" />
      <span className="text-white text-xs font-semibold">Crecimiento</span>
    </div>
    <div className="text-[#25B3CC] font-bold text-2xl mb-1">+340%</div>
    <div className="text-gray-500 text-[10px]">Nuevos clientes este mes</div>
    <div className="mt-3 flex gap-0.5 items-end h-8">
      {[30, 45, 35, 60, 55, 75, 70, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(h / 100) * 32}px`,
            background: `rgba(37,179,204,${0.2 + (i / 8) * 0.8})`,
          }}
        />
      ))}
    </div>
  </motion.div>
);

/* ─── Main Component ─────────────────────────────────────────────────── */
export const BusinessSection = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <WaviBusinessModal open={modalOpen} onClose={() => setModalOpen(false)} />
      {/* ═══ SECTION 1 — DUAL ECOSYSTEM ════════════════════════════════ */}
      <section className="py-24 bg-[#F7F9FA] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#25B3CC]/40 to-transparent" />

        <div className="container mx-auto px-6 md:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-[#25B3CC]/10 text-[#25B3CC] font-semibold text-sm mb-5 border border-[#25B3CC]/20">
              El Ecosistema WAVI
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-5">
              Dos experiencias. <br />
              <span className="text-[#25B3CC]">Un mismo universo.</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              WAVI conecta a personas con experiencias únicas, y a negocios con clientes ideales.
              Cada lado tiene su propia app — perfectamente diseñada para su rol.
            </p>
          </motion.div>

          {/* Dual Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <EcosystemCard
              type="consumer"
              label="Para Usuarios"
              title="WAVI — Descubre la Ciudad"
              description="La app para explorar, reservar y ganar recompensas en los mejores restaurantes, bares, rooftops y experiencias de la ciudad."
              features={[
                'Descubre experiencias curadas',
                'Reserva con un toque',
                'Acumula WAVI Points',
                'Comparte con amigos',
                'Acceso a eventos exclusivos',
              ]}
              accent="#25B3CC"
            />
            <div onClick={() => setModalOpen(true)} className="cursor-pointer">
              <EcosystemCard
                type="business"
                label="Para Negocios"
                title="WAVI Business — Gestiona y Crece"
                description="La plataforma profesional para restaurantes, cafés, bares y venues. Gestiona reservas, analiza métricas y conecta con tu audiencia ideal."
                features={[
                  'Dashboard de reservas en tiempo real',
                  'Analytics y reportes detallados',
                  'Gestión de perfil de negocio',
                  'Captación de nuevos clientes',
                  'Soporte dedicado de partner',
                ]}
                accent="#25B3CC"
                dark
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — WAVI BUSINESS HERO ════════════════════════════ */}
      <section id="wavi-business" className="py-28 bg-[#06080A] text-white relative overflow-hidden">
        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#25B3CC]/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#25B3CC]/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOHY2YzYuNjMgMCAxMiA1LjM3IDEyIDEySDM2eiIgZmlsbD0icmdiYSgyNSwxNzksMjA0LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {/* WAVI Business Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#25B3CC] flex items-center justify-center shadow-[0_0_30px_rgba(37,179,204,0.4)]">
                  <span className="text-white text-[10px] font-bold tracking-tight">WAVI</span>
                </div>
                <div>
                  <span className="text-white font-bold text-xl tracking-tight">WAVI Business</span>
                  <span className="block text-[#25B3CC] text-xs font-medium">Partner Platform</span>
                </div>
              </div>

              <span className="inline-block py-1.5 px-4 rounded-full bg-[#25B3CC]/15 text-[#25B3CC] font-semibold text-sm mb-6 border border-[#25B3CC]/30">
                Para Restaurantes, Bares & Venues
              </span>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
                Haz crecer tu negocio <br />
                con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25B3CC] to-[#7FDAEB]">
                  WAVI Business.
                </span>
              </h2>

              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Gestiona reservas, atrae nuevos clientes y forma parte del ecosistema de
                experiencias WAVI. Una plataforma diseñada para negocios de clase mundial.
              </p>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { value: '500+', label: 'Negocios Partner' },
                  { value: '98%', label: 'Satisfacción' },
                  { value: '3×', label: 'Más Reservas' },
                ].map((m, i) => (
                  <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-4 text-center">
                    <div className="text-[#25B3CC] font-bold text-xl">{m.value}</div>
                    <div className="text-gray-500 text-xs mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* App Store Badges */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 px-6 py-3.5 rounded-2xl transition-all shadow-xl hover:-translate-y-0.5"
                >
                  <Apple size={22} />
                  <div className="text-left">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500 leading-none">Únete en</div>
                    <div className="font-semibold text-sm leading-tight mt-0.5">App Store</div>
                  </div>
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center justify-center gap-3 bg-[#111827] border border-white/10 hover:border-[#25B3CC]/50 text-white px-6 py-3.5 rounded-2xl transition-all shadow-xl hover:-translate-y-0.5"
                >
                  <Play size={22} className="text-[#25B3CC]" />
                  <div className="text-left">
                    <div className="text-[9px] uppercase tracking-wider opacity-60 leading-none">Únete en</div>
                    <div className="font-semibold text-sm leading-tight mt-0.5">Google Play</div>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Right: Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Main dashboard */}
              <div className="relative z-10">
                <DashboardMockup />
              </div>

              {/* Floating analytics card */}
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                <AnalyticsCard />
              </div>

              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 right-0 bg-[#0E1419] border border-[#25B3CC]/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl z-20 hidden md:flex"
              >
                <div className="w-8 h-8 rounded-full bg-[#25B3CC]/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-[#25B3CC]" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Nueva reseña 5★</p>
                  <p className="text-gray-500 text-[10px]">"Experiencia increíble"</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — FEATURES GRID ══════════════════════════════════ */}
      <section className="py-20 bg-[#09090B] text-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h3 className="text-3xl font-bold mb-3">Todo lo que necesitas para brillar</h3>
            <p className="text-gray-500">Un ecosistema completo para gestionar y hacer crecer tu negocio.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Calendar className="w-5 h-5" />,
                title: 'Reservas en Tiempo Real',
                desc: 'Recibe, confirma y gestiona reservas al instante desde cualquier dispositivo.',
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: 'Analytics Avanzados',
                desc: 'Informes detallados de ocupación, ingresos, reseñas y comportamiento de clientes.',
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: 'Captación de Clientes',
                desc: 'Accede a la base de usuarios premium de WAVI que buscan experiencias como la tuya.',
              },
              {
                icon: <Globe className="w-5 h-5" />,
                title: 'Perfil Verificado',
                desc: 'Destaca en la plataforma con un perfil curado, verificado y de alta visibilidad.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Promociones Inteligentes',
                desc: 'Lanza ofertas especiales y experiencias exclusivas para los usuarios WAVI.',
              },
              {
                icon: <Award className="w-5 h-5" />,
                title: 'Programa de Rewards',
                desc: 'Tus clientes acumulan puntos WAVI al visitarte, fidelizándolos automáticamente.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/4 border border-white/8 hover:border-[#25B3CC]/40 rounded-2xl p-6 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25B3CC]/15 border border-[#25B3CC]/20 flex items-center justify-center text-[#25B3CC] mb-4 group-hover:bg-[#25B3CC]/25 transition-colors">
                  {f.icon}
                </div>
                <h4 className="font-bold text-white mb-2 text-base">{f.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — ONBOARDING FLOW ════════════════════════════════ */}
      <section className="py-24 bg-[#06080A] text-white border-t border-white/5">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-[#25B3CC]/15 text-[#25B3CC] font-semibold text-sm mb-5 border border-[#25B3CC]/30">
              Proceso de Incorporación
            </span>
            <h3 className="text-4xl font-bold mb-4 tracking-tight">
              De la descarga al primer cliente
              <br />
              <span className="text-[#25B3CC]">en 4 pasos.</span>
            </h3>
            <p className="text-gray-500 max-w-xl mx-auto">
              Nuestro proceso de onboarding está diseñado para que tu negocio esté operativo en la plataforma WAVI lo más rápido posible.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto relative">
            {/* Dashed connector for desktop */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-[#25B3CC]/20 z-0" />

            <OnboardingStep
              step={1}
              icon={<Download className="w-6 h-6" />}
              title="Descarga WAVI Business"
              description="Disponible en App Store y Google Play. Gratis para empezar."
              delay={0}
            />
            <OnboardingStep
              step={2}
              icon={<Smartphone className="w-6 h-6" />}
              title="Crea tu Perfil de Negocio"
              description="Completa la información de tu restaurante, bar o venue en minutos."
              delay={0.1}
            />
            <OnboardingStep
              step={3}
              icon={<Shield className="w-6 h-6" />}
              title="Verificación WAVI"
              description="Nuestro equipo revisa y certifica tu negocio en 48 horas."
              delay={0.2}
            />
            <OnboardingStep
              step={4}
              icon={<TrendingUp className="w-6 h-6" />}
              title="Empieza a Crecer"
              description="Recibe reservas, analiza métricas y conecta con tu audiencia."
              delay={0.3}
            />
          </div>

          {/* Venue photo + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-20 rounded-3xl overflow-hidden relative max-w-5xl mx-auto"
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1619111228874-26c73d205227?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZXN0YXVyYW50JTIwYmFyJTIwaW50ZXJpb3IlMjBwcmVtaXVtJTIwbmlnaHR8ZW58MXx8fHwxNzc4MjIyMTQyfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Premium Restaurant"
              className="w-full h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06080A]/90 via-[#06080A]/60 to-transparent flex items-center">
              <div className="px-10 md:px-16 max-w-2xl">
                <h4 className="text-3xl font-bold text-white mb-3">
                  ¿Listo para unirte al ecosistema WAVI?
                </h4>
                <p className="text-gray-300 mb-6">
                  Miles de clientes premium te están esperando. Descarga WAVI Business hoy y empieza a recibir reservas.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-[0_0_20px_rgba(37,179,204,0.3)] hover:shadow-[0_0_30px_rgba(37,179,204,0.5)]"
                  >
                    <Apple size={18} /> Registrar mi Negocio
                  </button>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full font-semibold text-sm transition-all"
                  >
                    <Play size={18} /> Saber Más
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};