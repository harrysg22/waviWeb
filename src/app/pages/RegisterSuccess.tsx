import React from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'

export default function RegisterSuccess() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#25B3CC]/6 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex flex-col items-center text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-[#25B3CC]/15 border-2 border-[#25B3CC] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(37,179,204,0.25)]"
        >
          <CheckCircle2 className="w-10 h-10 text-[#25B3CC]" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="inline-flex items-center gap-2 bg-[#25B3CC]/12 border border-[#25B3CC]/25 rounded-full px-4 py-1.5 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#25B3CC] animate-pulse" />
            <span className="text-[#25B3CC] text-xs font-semibold uppercase tracking-wider">Solicitud Enviada</span>
          </div>

          <h1 className="text-white text-2xl font-bold mb-3 tracking-tight">
            ¡Bienvenido al ecosistema WAVI!
          </h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            Hemos recibido tu solicitud. Nuestro equipo la revisará y te contactaremos en un máximo de{' '}
            <span className="text-white font-semibold">48 horas hábiles</span>.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { v: '24h', l: 'Revisión' },
              { v: '48h', l: 'Verificación' },
              { v: '72h', l: 'Activación' },
            ].map((m, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl py-3">
                <div className="text-[#25B3CC] font-bold text-base">{m.v}</div>
                <div className="text-gray-600 text-[10px] mt-0.5">{m.l}</div>
              </div>
            ))}
          </div>

          <Link
            to="/"
            className="inline-flex items-center bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(37,179,204,0.3)]"
          >
            Volver al sitio
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
