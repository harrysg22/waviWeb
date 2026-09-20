import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useBusinessSites } from '@/lib/useBusinessSite'
import { PortalHeader } from '@/app/components/portal/PortalHeader'
import { Building2, Wrench, Tag, CalendarDays, ChevronRight, Loader2 } from 'lucide-react'

interface Counts { services: number; promos: number; events: number }

export default function BusinessPortal() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [authId, setAuthId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/register', { replace: true }); return }
      setAuthId(session.user.id)
    })
  }, [])

  const { sites, loading } = useBusinessSites(authId)

  const siteIdParam    = searchParams.get('site')
  const selectedSite   = sites.find(s => s.siteId === Number(siteIdParam)) ?? sites[0] ?? null
  const selectedSiteId = selectedSite?.siteId ?? 0

  // If no ?site param yet but we have sites, set it
  useEffect(() => {
    if (sites.length > 0 && !siteIdParam) {
      setSearchParams({ site: String(sites[0].siteId) }, { replace: true })
    }
  }, [sites, siteIdParam])

  useEffect(() => {
    if (!selectedSiteId) return
    Promise.all([
      supabase.from('service')  .select('id', { count: 'exact', head: true }).eq('site_id', selectedSiteId).eq('active', true),
      supabase.from('promotion').select('id', { count: 'exact', head: true }).eq('site_id', selectedSiteId).eq('active', true),
      supabase.from('event')    .select('id', { count: 'exact', head: true }).eq('site_id', selectedSiteId).eq('active', true),
    ]).then(([s, p, e]) => {
      setCounts({ services: s.count ?? 0, promos: p.count ?? 0, events: e.count ?? 0 })
    })
  }, [selectedSiteId])

  const handleSiteChange = (siteId: number) => {
    setSearchParams({ site: String(siteId) })
    setCounts(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: 'Información del negocio', icon: Building2, gradient: 'from-[#25B3CC] to-[#198A9E]', href: `/portal/info?site=${selectedSiteId}`,     count: null },
    { label: 'Servicios',               icon: Wrench,    gradient: 'from-[#198A9E] to-[#0F5F72]', href: `/portal/services?site=${selectedSiteId}`, count: counts?.services ?? null },
    { label: 'Promociones',             icon: Tag,       gradient: 'from-[#B8860B] to-[#8B6914]', href: `/portal/promos?site=${selectedSiteId}`,   count: counts?.promos ?? null },
    { label: 'Eventos',                 icon: CalendarDays, gradient: 'from-[#6B3FA0] to-[#4A2970]', href: `/portal/events?site=${selectedSiteId}`, count: counts?.events ?? null },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <PortalHeader
        title="Portal Wavi"
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSiteChange={handleSiteChange}
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <p className="text-gray-500 text-sm text-center mb-2">
          Gestiona la información de tu negocio en WAVI
        </p>

        {cards.map(({ label, icon: Icon, gradient, href, count }) => (
          <Link key={href} to={href}
            className={`relative rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden shadow-md hover:shadow-lg transition-all group`}>
            <div className="absolute right-4 bottom-3 opacity-15">
              <Icon className="w-20 h-20 text-white" />
            </div>
            <div className="relative flex items-center justify-between px-6 py-7">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{label}</p>
                  {count !== null && (
                    <p className="text-white/70 text-xs mt-0.5">{count} {count === 1 ? 'activo' : 'activos'}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0" />
            </div>
          </Link>
        ))}

        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">¿Tienes otro negocio?</p>
            <p className="text-xs text-gray-400 mt-0.5">Gestiona todo desde un solo lugar</p>
          </div>
          <Link to="/register?new=1"
            className="flex items-center gap-1.5 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0">
            <Plus className="w-4 h-4" /> Agregar negocio
          </Link>
        </div>
      </div>
    </div>
  )
}
