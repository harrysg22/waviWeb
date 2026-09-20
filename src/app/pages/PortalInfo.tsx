import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useBusinessSites } from '@/lib/useBusinessSite'
import PortalHeader from '@/app/components/PortalHeader'
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Clock, Phone, Globe, Instagram, MessageCircle, Upload,
} from 'lucide-react'

const inputCls  = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition-all focus:ring-2 focus:ring-[#25B3CC]/15'
const selectCls = `${inputCls} appearance-none cursor-pointer`

interface Zone      { id: number; name: string }
interface HourEntry { weekday: number; open: boolean; start_time: string; end_time: string }

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function generateTimeOptions() {
  const opts: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const h12 = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      opts.push(`${h12}:${m === 0 ? '00' : '30'} ${ampm}`)
    }
  }
  return opts
}
const TIME_OPTIONS = generateTimeOptions()

function dbTimeToWavi(t: string): string {
  if (!t) return '9:00 AM'
  if (t.includes('AM') || t.includes('PM')) return t
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr ?? '0', 10)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12  = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m === 0 ? '00' : '30'} ${ampm}`
}

const INITIAL_HOURS: HourEntry[] = Array.from({ length: 7 }, (_, i) => ({
  weekday: i + 1, open: true, start_time: '9:00 AM', end_time: '9:00 PM',
}))

export default function PortalInfo() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [authId, setAuthId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthId(session?.user.id ?? null))
  }, [])

  const { sites, loading: sitesLoading } = useBusinessSites(authId)
  const siteIdParam  = searchParams.get('site')
  const selectedSite = sites.find(s => s.siteId === Number(siteIdParam)) ?? sites[0] ?? null
  const siteId       = selectedSite?.siteId ?? 0
  const companyId    = selectedSite?.companyId ?? 0

  const [name,         setName]         = useState('')
  const [description,  setDescription]  = useState('')
  const [address,      setAddress]      = useState('')
  const [zoneId,       setZoneId]       = useState<number | null>(null)
  const [meanPrice,    setMeanPrice]    = useState('')
  const [hours,        setHours]        = useState<HourEntry[]>(INITIAL_HOURS)
  const [phone,        setPhone]        = useState('')
  const [whatsapp,     setWhatsapp]     = useState('')
  const [website,      setWebsite]      = useState('')
  const [instagram,    setInstagram]    = useState('')
  const [logoUrl,      setLogoUrl]      = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [zones,        setZones]        = useState<Zone[]>([])
  const [dataLoading,  setDataLoading]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [hasPending,   setHasPending]   = useState(false)

  // Reload when selected site changes
  useEffect(() => {
    if (!selectedSite || !siteId) return
    setDataLoading(true)
    setSuccess(false)
    setError(null)

    ;(async () => {
      const [zonesRes, hoursRes, contactsRes, pendingRes] = await Promise.all([
        supabase.from('zone').select('id, name').eq('city', 'Bogotá').order('name'),
        supabase.from('business_hours').select('weekday, start_time, end_time').eq('site_id', siteId),
        supabase.from('company_contact').select('method, link').eq('company_id', companyId),
        supabase.from('business_edit_request')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId).eq('type', 'profile').eq('status', 'pending'),
      ])

      if (zonesRes.data) setZones(zonesRes.data)

      setName(selectedSite.name)
      setDescription(selectedSite.details ?? selectedSite.description ?? '')
      setAddress(selectedSite.address)
      setZoneId(selectedSite.zoneId)
      setMeanPrice(selectedSite.meanPrice?.toString() ?? '')
      setLogoUrl(selectedSite.logoUrl ?? '')
      setPhone(''); setWhatsapp(''); setWebsite(''); setInstagram('')

      if (hoursRes.data && hoursRes.data.length > 0) {
        setHours(INITIAL_HOURS.map(h => {
          const db = hoursRes.data.find(d => d.weekday === h.weekday)
          return db
            ? { ...h, open: true, start_time: dbTimeToWavi(db.start_time), end_time: dbTimeToWavi(db.end_time) }
            : { ...h, open: false }
        }))
      } else {
        setHours(INITIAL_HOURS)
      }

      if (contactsRes.data) {
        contactsRes.data.forEach(c => {
          if (c.method === 'phone')     setPhone(c.link)
          if (c.method === 'whatsapp')  setWhatsapp(c.link)
          if (c.method === 'website')   setWebsite(c.link)
          if (c.method === 'instagram') setInstagram(c.link)
        })
      }

      setHasPending((pendingRes.count ?? 0) > 0)
      setDataLoading(false)
    })()
  }, [siteId])

  const updateHour = (weekday: number, field: keyof HourEntry, value: any) =>
    setHours(prev => prev.map(h => h.weekday === weekday ? { ...h, [field]: value } : h))

  const handleLogoUpload = async (file: File) => {
    if (!authId) return
    setLogoUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${authId}/logo-edit-${siteId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-registrations').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('business-registrations').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    }
    setLogoUploading(false)
  }

  const handleSubmit = async () => {
    if (!selectedSite || !authId) return
    if (!name.trim())    { setError('El nombre del negocio es obligatorio.'); return }
    if (!address.trim()) { setError('La dirección es obligatoria.'); return }
    if (!zoneId)         { setError('Selecciona la zona de Bogotá.'); return }

    setSubmitting(true); setError(null)

    const contacts = [
      phone     && { method: 'phone',     link: phone },
      whatsapp  && { method: 'whatsapp',  link: whatsapp },
      website   && { method: 'website',   link: website },
      instagram && { method: 'instagram', link: instagram },
    ].filter(Boolean)

    const businessHours = hours.filter(h => h.open).map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time }))

    const { error: insertErr } = await supabase.from('business_edit_request').insert({
      site_id: siteId,
      auth_id: authId,
      type:    'profile',
      action:  'update',
      payload: { business_name: name, description, address, zone_id: zoneId, mean_price: meanPrice || null, business_hours: businessHours, contacts, logo_url: logoUrl },
    })

    setSubmitting(false)
    if (insertErr) { setError('Error al enviar. Intenta de nuevo.'); return }
    setSuccess(true)
    setHasPending(true)
  }

  const backTo = `/portal?site=${siteId}`

  if (sitesLoading) {
    return <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <PortalHeader
        title="Información del negocio"
        subtitle="Los cambios requieren revisión"
        backTo={backTo}
        sites={sites}
        selectedSiteId={siteId}
        onSiteChange={id => navigate(`/portal/info?site=${id}`)}
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">
        {dataLoading && (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" /></div>
        )}

        {!dataLoading && (
          <>
            {hasPending && !success && (
              <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-yellow-700 text-sm">Ya tienes una solicitud de cambio en revisión. Puedes enviar otra cuando quieras.</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">Solicitud enviada. El equipo WAVI revisará los cambios pronto.</p>
              </div>
            )}

            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Información básica</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre del negocio *</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea className={`${inputCls} resize-none`} rows={4} value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
                <div className="text-right text-gray-400 text-[11px] mt-1">{description.length}/500</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio promedio por persona (COP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input className={`${inputCls} pl-7`} type="number" value={meanPrice} onChange={e => setMeanPrice(e.target.value)} min="0" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Ubicación</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dirección *</label>
                <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Zona de Bogotá *</label>
                <div className="relative">
                  <select className={`${selectCls} ${!zoneId ? 'text-gray-400' : ''}`}
                    value={zoneId ?? ''} onChange={e => setZoneId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Selecciona la zona</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Horarios</h2>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[80px_48px_1fr_1fr] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  {['Día','Abre','Desde','Hasta'].map(h => (
                    <span key={h} className="text-gray-400 text-[11px] font-semibold uppercase text-center first:text-left">{h}</span>
                  ))}
                </div>
                {hours.map((h, i) => (
                  <div key={h.weekday} className={`grid grid-cols-[80px_48px_1fr_1fr] gap-2 items-center px-4 py-2.5 ${i < hours.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <span className={`text-sm font-medium ${h.open ? 'text-gray-800' : 'text-gray-400'}`}>{DAYS[h.weekday - 1]}</span>
                    <div className="flex justify-center">
                      <button type="button" onClick={() => updateHour(h.weekday, 'open', !h.open)}
                        className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${h.open ? 'bg-[#25B3CC]' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${h.open ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {h.open ? (
                      <>
                        <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 text-xs outline-none focus:border-[#25B3CC] appearance-none"
                          value={h.start_time} onChange={e => updateHour(h.weekday, 'start_time', e.target.value)}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 text-xs outline-none focus:border-[#25B3CC] appearance-none"
                          value={h.end_time} onChange={e => updateHour(h.weekday, 'end_time', e.target.value)}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </>
                    ) : (
                      <span className="col-span-2 text-gray-400 text-xs text-center">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Contacto</h2>
              {[
                { icon: Phone,         label: 'Teléfono',  val: phone,     set: setPhone,     ph: '+57 300 000 0000' },
                { icon: MessageCircle, label: 'WhatsApp',  val: whatsapp,  set: setWhatsapp,  ph: '+57 300 000 0000' },
                { icon: Globe,         label: 'Sitio web', val: website,   set: setWebsite,   ph: 'https://miweb.com' },
                { icon: Instagram,     label: 'Instagram', val: instagram, set: setInstagram, ph: '@minegocio' },
              ].map(({ icon: Icon, label, val, set, ph }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className={`${inputCls} pl-10`} value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                  </div>
                </div>
              ))}
            </div>

            {/* Logo */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Logo</h2>
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  <label className="cursor-pointer text-[#25B3CC] hover:text-[#1E9DB5] text-sm font-medium transition-colors">
                    Cambiar logo
                    <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
                  </label>
                </div>
              ) : (
                <label className={`flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-[#25B3CC]/50 transition-colors ${logoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {logoUploading ? <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                  <span className="text-gray-500 text-sm">{logoUploading ? 'Subiendo…' : 'Subir logo'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
                </label>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || success}
              className="w-full flex items-center justify-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : null}
              {submitting ? 'Enviando…' : success ? 'Solicitud enviada' : 'Enviar solicitud de cambio'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
