import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Loader2, Building2, ChevronRight, Clock, Wrench, Tag, CalendarDays } from 'lucide-react'

/* ─── Registrations ─────────────────────────────────────────────────────────── */

interface Registration {
  id:            number
  business_name: string
  email:         string
  submitted_at:  string
  status:        'pending' | 'approved' | 'rejected'
  logo_url:      string | null
}

type RegTab = 'pending' | 'approved' | 'rejected'

const REG_TAB_LABEL: Record<RegTab, string> = {
  pending:  'Pendientes',
  approved: 'Aprobados',
  rejected: 'Rechazados',
}

const REG_STATUS_SINGULAR: Record<RegTab, string> = {
  pending:  'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const BADGE_CLS: Record<RegTab, string> = {
  pending:  'bg-yellow-400/15 text-yellow-400 border border-yellow-400/25',
  approved: 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/25',
  rejected: 'bg-red-400/15 text-red-400 border border-red-400/25',
}

/* ─── Edit requests ──────────────────────────────────────────────────────────── */

interface EditRequest {
  id:          number
  type:        string
  action:      string
  submitted_at: string
  site: { name: string; logo_url: string | null } | null
}

const TYPE_LABEL: Record<string, string> = {
  profile: 'Información del negocio',
  service: 'Servicio',
  promo:   'Promoción',
  event:   'Evento',
}

const TYPE_ICON: Record<string, React.FC<any>> = {
  profile: Building2,
  service: Wrench,
  promo:   Tag,
  event:   CalendarDays,
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
}

const ACTION_BADGE: Record<string, string> = {
  create: 'bg-blue-400/15 text-blue-400 border border-blue-400/25',
  update: 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/25',
  delete: 'bg-red-400/15 text-red-400 border border-red-400/25',
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

type Section = 'registrations' | 'edits'

export default function AdminDashboard() {
  const [section, setSection] = useState<Section>('registrations')

  // Registrations
  const [regTab,         setRegTab]         = useState<RegTab>('pending')
  const [registrations,  setRegistrations]  = useState<Registration[]>([])
  const [regLoading,     setRegLoading]     = useState(true)

  // Edit requests
  const [editRequests,   setEditRequests]   = useState<EditRequest[]>([])
  const [editsLoading,   setEditsLoading]   = useState(true)
  const [pendingEdits,   setPendingEdits]   = useState(0)

  useEffect(() => {
    setRegLoading(true)
    supabase
      .from('business_registration')
      .select('id, business_name, email, submitted_at, status, logo_url')
      .eq('status', regTab)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setRegistrations((data as Registration[]) ?? [])
        setRegLoading(false)
      })
  }, [regTab])

  useEffect(() => {
    setEditsLoading(true)
    supabase
      .from('business_edit_request')
      .select('id, type, action, submitted_at, site(name, logo_url)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
      .then(({ data, count }) => {
        setEditRequests((data as any[]) ?? [])
        setPendingEdits(data?.length ?? 0)
        setEditsLoading(false)
      })
  }, [])

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
          <p className="text-gray-500 text-sm">Gestiona las solicitudes de registro y cambios de negocios.</p>
        </div>

        {/* Section selector */}
        <div className="flex gap-1 bg-white/4 border border-white/8 rounded-2xl p-1 mb-6 w-fit">
          <button
            onClick={() => setSection('registrations')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${section === 'registrations' ? 'bg-[#25B3CC] text-white shadow-[0_0_12px_rgba(37,179,204,0.3)]' : 'text-gray-400 hover:text-white'}`}
          >
            Registros nuevos
          </button>
          <button
            onClick={() => setSection('edits')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${section === 'edits' ? 'bg-[#25B3CC] text-white shadow-[0_0_12px_rgba(37,179,204,0.3)]' : 'text-gray-400 hover:text-white'}`}
          >
            Solicitudes de cambio
            {pendingEdits > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === 'edits' ? 'bg-white/20 text-white' : 'bg-yellow-400/20 text-yellow-400'}`}>
                {pendingEdits}
              </span>
            )}
          </button>
        </div>

        {/* ── Registrations section ── */}
        {section === 'registrations' && (
          <>
            <div className="flex gap-1 bg-white/4 border border-white/8 rounded-2xl p-1 mb-6 w-fit">
              {(['pending', 'approved', 'rejected'] as RegTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setRegTab(t)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${regTab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {REG_TAB_LABEL[t]}
                </button>
              ))}
            </div>

            {regLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" /></div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No hay solicitudes {REG_TAB_LABEL[regTab].toLowerCase()} por ahora.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {registrations.map(reg => (
                  <Link key={reg.id} to={`/admin/${reg.id}`}
                    className="flex items-center gap-4 bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/15 rounded-2xl px-5 py-4 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-[#25B3CC]/15 border border-[#25B3CC]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {reg.logo_url ? <img src={reg.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-[#25B3CC]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{reg.business_name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{reg.email}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 text-gray-600 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(reg.submitted_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${BADGE_CLS[reg.status]}`}>
                        {REG_STATUS_SINGULAR[reg.status]}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Edit requests section ── */}
        {section === 'edits' && (
          <>
            {editsLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" /></div>
            ) : editRequests.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No hay solicitudes de cambio pendientes.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {editRequests.map(req => {
                  const Icon = TYPE_ICON[req.type] ?? Building2
                  const site = req.site as any
                  return (
                    <Link key={req.id} to={`/admin/edits/${req.id}`}
                      className="flex items-center gap-4 bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/15 rounded-2xl px-5 py-4 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-[#25B3CC]/15 border border-[#25B3CC]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {site?.logo_url ? <img src={site.logo_url} alt="" className="w-full h-full object-cover" /> : <Icon className="w-5 h-5 text-[#25B3CC]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{site?.name ?? 'Negocio'}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{TYPE_LABEL[req.type] ?? req.type}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(req.submitted_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${ACTION_BADGE[req.action] ?? BADGE_CLS.pending}`}>
                          {ACTION_LABEL[req.action] ?? req.action}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
