import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Loader2, Building2, ChevronRight, Clock } from 'lucide-react'

interface Registration {
  id:           number
  business_name: string
  email:         string
  submitted_at:  string
  status:        'pending' | 'approved' | 'rejected'
}

type Tab = 'pending' | 'approved' | 'rejected'

const TAB_LABEL: Record<Tab, string> = {
  pending:  'Pendientes',
  approved: 'Aprobados',
  rejected: 'Rechazados',
}

const STATUS_SINGULAR: Record<Tab, string> = {
  pending:  'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const BADGE_CLS: Record<Tab, string> = {
  pending:  'bg-yellow-400/15 text-yellow-400 border border-yellow-400/25',
  approved: 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/25',
  rejected: 'bg-red-400/15 text-red-400 border border-red-400/25',
}

export default function AdminDashboard() {
  const [tab,           setTab]           = useState<Tab>('pending')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('business_registration')
      .select('id, business_name, email, submitted_at, status')
      .eq('status', tab)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setRegistrations((data as Registration[]) ?? [])
        setLoading(false)
      })
  }, [tab])

  return (
    <div className="min-h-screen bg-[#0D1117] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#25B3CC] flex items-center justify-center shadow-[0_0_16px_rgba(37,179,204,0.3)]">
              <span className="text-white text-[8px] font-bold">WAVI</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Panel de Administración</h1>
          </div>
          <p className="text-gray-500 text-sm">Gestiona las solicitudes de registro de negocios.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/4 border border-white/8 rounded-2xl p-1 mb-6 w-fit">
          {(['pending', 'approved', 'rejected'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-[#25B3CC] text-white shadow-[0_0_12px_rgba(37,179,204,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay solicitudes {TAB_LABEL[tab].toLowerCase()} por ahora.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {registrations.map(reg => (
              <Link
                key={reg.id}
                to={`/admin/${reg.id}`}
                className="flex items-center gap-4 bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/15 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25B3CC]/15 border border-[#25B3CC]/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#25B3CC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{reg.business_name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{reg.email}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(reg.submitted_at).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${BADGE_CLS[reg.status]}`}>
                    {STATUS_SINGULAR[reg.status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
