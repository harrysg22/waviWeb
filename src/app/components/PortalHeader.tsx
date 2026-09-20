import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { BusinessSiteData } from '@/lib/useBusinessSite'
import { ArrowLeft, Building2, ChevronDown, LogOut, Check } from 'lucide-react'

interface PortalHeaderProps {
  title:           string
  subtitle?:       string
  backTo?:         string        // if set, shows back arrow instead of sign-out
  sites:           BusinessSiteData[]
  selectedSiteId:  number
  onSiteChange:    (siteId: number) => void
  gradientClass?:  string        // e.g. 'bg-[#198A9E]' for sub-pages
}

export default function PortalHeader({
  title,
  subtitle,
  backTo,
  sites,
  selectedSiteId,
  onSiteChange,
  gradientClass = 'bg-[#25B3CC]',
}: PortalHeaderProps) {
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)
  const dropRef   = useRef<HTMLDivElement>(null)

  const selected  = sites.find(s => s.siteId === selectedSiteId) ?? sites[0]
  const multiSite = sites.length > 1

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className={`${gradientClass} px-6 py-5 sticky top-0 z-20`}>
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">

        {/* Left: back arrow or logo */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {backTo ? (
            <button
              onClick={() => navigate(backTo)}
              className="text-white/80 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {selected?.logoUrl
                ? <img src={selected.logoUrl} alt="logo" className="w-full h-full object-cover" />
                : <Building2 className="w-4 h-4 text-white" />}
            </div>
          )}

          {/* Business selector */}
          <div ref={dropRef} className="relative min-w-0">
            <button
              onClick={() => multiSite && setOpen(v => !v)}
              className={`flex items-center gap-1.5 text-left min-w-0 ${multiSite ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="min-w-0">
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider leading-none mb-0.5">
                  {title}
                </p>
                <p className="text-white font-bold text-sm leading-tight truncate max-w-[180px]">
                  {selected?.name ?? '—'}
                </p>
                {subtitle && (
                  <p className="text-white/60 text-[10px] mt-0.5 leading-tight">{subtitle}</p>
                )}
              </div>
              {multiSite && (
                <ChevronDown className={`w-4 h-4 text-white/70 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Dropdown */}
            {open && multiSite && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {sites.map(s => (
                  <button
                    key={s.siteId}
                    onClick={() => { onSiteChange(s.siteId); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#25B3CC]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {s.logoUrl
                        ? <img src={s.logoUrl} alt="" className="w-full h-full object-cover" />
                        : <Building2 className="w-4 h-4 text-[#25B3CC]" />}
                    </div>
                    <span className="text-gray-800 text-sm font-medium flex-1 truncate">{s.name}</span>
                    {s.siteId === selectedSiteId && (
                      <Check className="w-4 h-4 text-[#25B3CC] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: sign-out (only on hub, i.e. no backTo) */}
        {!backTo && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}
      </div>
    </div>
  )
}
