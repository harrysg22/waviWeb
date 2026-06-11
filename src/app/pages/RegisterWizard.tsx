import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import {
  ChevronDown, ChevronUp, Check, AlertCircle, Loader2,
  MapPin, Phone, Globe, Instagram, MessageCircle, Clock,
  CheckCircle2, Sparkles, ArrowLeft, ChevronRight, Upload, ImageIcon,
} from 'lucide-react'

declare const google: any

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface Category    { id: number; name: string }
interface Zone        { id: number; name: string }
interface CuisineType { id: number; name: string }
interface Amenity     { id: number; name: string; description: string }
interface HourEntry   { weekday: number; open: boolean; start_time: string; end_time: string }

interface WizardData {
  business_name:    string
  category_ids:     number[]
  cuisine_type_ids: number[]
  description:      string
  mean_price:       string
  address:          string
  zone_id:          number | null
  location_lat:     number | null
  location_lng:     number | null
  business_hours:   HourEntry[]
  amenity_ids:      number[]
  phone:            string
  whatsapp:         string
  website:          string
  instagram:        string
  main_image_url:   string
  logo_url:         string
}

const INITIAL_HOURS: HourEntry[] = [
  { weekday: 1, open: true,  start_time: '9:00 AM',  end_time: '9:00 PM' },
  { weekday: 2, open: true,  start_time: '9:00 AM',  end_time: '9:00 PM' },
  { weekday: 3, open: true,  start_time: '9:00 AM',  end_time: '9:00 PM' },
  { weekday: 4, open: true,  start_time: '9:00 AM',  end_time: '9:00 PM' },
  { weekday: 5, open: true,  start_time: '9:00 AM',  end_time: '10:00 PM' },
  { weekday: 6, open: true,  start_time: '10:00 AM', end_time: '10:00 PM' },
  { weekday: 7, open: false, start_time: '10:00 AM', end_time: '6:00 PM' },
]

const INITIAL_DATA: WizardData = {
  business_name: '', category_ids: [], cuisine_type_ids: [],
  description: '', mean_price: '', address: '', zone_id: null,
  location_lat: null, location_lng: null, business_hours: INITIAL_HOURS,
  amenity_ids: [], phone: '', whatsapp: '', website: '', instagram: '',
  main_image_url: '', logo_url: '',
}

function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const h12  = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      const min  = m === 0 ? '00' : '30'
      times.push(`${h12}:${min} ${ampm}`)
    }
  }
  return times
}
const TIME_OPTIONS = generateTimeOptions()
const DAYS_LABELS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const inputCls  = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition-all focus:ring-2 focus:ring-[#25B3CC]/15'
const selectCls = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none cursor-pointer text-gray-900 focus:ring-2 focus:ring-[#25B3CC]/15'

/* ─── Section config ─────────────────────────────────────────────────────────── */
const SECTIONS = [
  { label: 'NEGOCIO',   title: 'Tu negocio' },
  { label: 'UBICACIÓN', title: 'Ubicación' },
  { label: 'HORARIOS',  title: 'Horarios' },
  { label: 'CONTACTO',  title: 'Contacto' },
  { label: 'IMAGEN',    title: 'Imagen principal' },
  { label: 'LOGO',      title: 'Logo' },
  { label: 'SERVICIOS', title: 'Servicios extra' },
]
const PART1_INDICES = [0, 1, 2, 3]
const PART2_INDICES = [4, 5, 6]

/* ─── Image upload helper ────────────────────────────────────────────────────── */
async function uploadImage(file: File, userId: string, type: 'main' | 'logo'): Promise<string> {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${type}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('business-registrations')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('business-registrations').getPublicUrl(path)
  return data.publicUrl
}

/* ─── Auth Screen ────────────────────────────────────────────────────────────── */
const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const signIn = async (provider: 'google' | 'apple') => {
    setLoading(provider); setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/register` },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <div className="bg-[#25B3CC] px-6 py-5">
        <div className="max-w-lg mx-auto">
          <a href="/" className="text-white/80 hover:text-white text-sm flex items-center gap-1.5 mb-3 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </a>
          <h1 className="text-white text-xl font-bold">Registra tu negocio</h1>
          <p className="text-white/75 text-sm mt-0.5">Únete a WAVI y llega a más clientes en Bogotá</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#25B3CC] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xs font-bold">WAVI</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Bienvenido</h2>
              <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar con tu registro</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => signIn('google')} disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-all disabled:opacity-70">
                {loading === 'google' ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continuar con Google
              </button>
              <button onClick={() => signIn('apple')} disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-70">
                {loading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.77 3.15.8 1.2-.24 2.35-1 3.62-.84 1.55.2 2.7.88 3.42 2.26-3.13 1.83-2.39 5.88.73 7.17-.61 1.62-1.4 3.17-2.92 3.49zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                )}
                Continuar con Apple
              </button>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <p className="text-center text-gray-400 text-xs mt-6 leading-relaxed">
              Al continuar aceptas nuestros{' '}
              <a href="/terminos-y-condiciones" className="text-[#25B3CC] hover:underline">Términos</a>
              {' '}y{' '}
              <a href="/politica-de-privacidad" className="text-[#25B3CC] hover:underline">Política de Privacidad</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Accordion Section ──────────────────────────────────────────────────────── */
function AccordionSection({
  index, title, summary, isOpen, isCompleted, isLocked,
  onHeaderClick, children, error,
}: {
  index:         number
  title:         string
  summary:       string
  isOpen:        boolean
  isCompleted:   boolean
  isLocked:      boolean
  onHeaderClick: () => void
  children:      React.ReactNode
  error?:        string | null
}) {
  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isOpen      ? 'border-[#25B3CC]/50 shadow-sm'
      : isCompleted ? 'border-green-200'
      : isLocked    ? 'border-gray-100 opacity-50'
      :               'border-gray-100'
    }`}>
      <div
        onClick={isLocked ? undefined : onHeaderClick}
        className={`flex items-center gap-3 px-5 py-4 transition-colors ${
          isLocked    ? 'cursor-not-allowed'
          : isCompleted ? 'bg-green-50 rounded-2xl cursor-pointer hover:bg-green-100'
          : isOpen      ? 'border-b border-[#25B3CC]/15 cursor-pointer'
          :               'cursor-pointer hover:bg-gray-50 rounded-2xl'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all ${
          isCompleted ? 'bg-green-500 text-white'
          : isOpen    ? 'bg-[#25B3CC] text-white'
          : isLocked  ? 'bg-gray-100 text-gray-300'
          :             'bg-gray-100 text-gray-400'
        }`}>
          {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <span className={`font-semibold text-sm ${isLocked ? 'text-gray-300' : 'text-gray-900'}`}>
            {title}
          </span>
          {isCompleted && summary && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">{summary}</p>
          )}
        </div>

        {!isLocked && (
          isCompleted
            ? <span className="text-[#25B3CC] text-xs font-semibold flex-shrink-0">EDITAR</span>
            : isOpen
            ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {isOpen && (
        <div className="px-5 pb-5 pt-4">
          {children}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ContinuarBtn({ onClick, loading = false, label = 'Continuar' }: {
  onClick: () => void; loading?: boolean; label?: string
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all mt-5 disabled:opacity-70">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{label} <ChevronRight className="w-4 h-4" /></>}
    </button>
  )
}

/* ─── Step 1 — Tu negocio ────────────────────────────────────────────────────── */
function Step1({ data, set, categories, cuisineTypes }: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void
  categories: Category[]; cuisineTypes: CuisineType[]
}) {
  const toggle = (key: 'category_ids' | 'cuisine_type_ids', id: number) => {
    const arr = data[key] as number[]
    set(key, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Nombre del negocio <span className="text-[#25B3CC]">*</span>
        </label>
        <input className={inputCls} placeholder="Ej. El Rincón Bogotano"
          value={data.business_name} onChange={e => set('business_name', e.target.value)} maxLength={100} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Categorías <span className="text-[#25B3CC]">*</span>
        </label>
        <p className="text-gray-400 text-xs mb-2">Elige todas las categorías que apliquen a tu negocio.</p>
        {categories.length === 0
          ? <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
          : <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggle('category_ids', cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    data.category_ids.includes(cat.id)
                      ? 'bg-[#25B3CC]/10 border-[#25B3CC] text-[#25B3CC]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>{cat.name}</button>
              ))}
            </div>
        }
      </div>
      {cuisineTypes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Restaurante <span className="normal-case font-normal text-gray-400">(tipo de cocina)</span>
          </label>
          <p className="text-gray-400 text-xs mb-2">Si tu negocio es un restaurante, selecciona el tipo de cocina que ofrece. Si no aplica, deja esto vacío.</p>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map(ct => (
              <button key={ct.id} type="button" onClick={() => toggle('cuisine_type_ids', ct.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  data.cuisine_type_ids.includes(ct.id)
                    ? 'bg-[#25B3CC]/10 border-[#25B3CC] text-[#25B3CC]'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>{ct.name}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Descripción <span className="text-[#25B3CC]">*</span>
        </label>
        <textarea className={`${inputCls} resize-none`} rows={4}
          placeholder="Describe qué hace especial a tu negocio, qué experiencia ofreces..."
          value={data.description} onChange={e => set('description', e.target.value)} maxLength={500} />
        <div className="text-right text-gray-400 text-[11px] mt-1">{data.description.length}/500</div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Precio promedio por persona (COP)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input className={`${inputCls} pl-7`} type="number" placeholder="Ej. 45000"
            value={data.mean_price} onChange={e => set('mean_price', e.target.value)} min="0" />
        </div>
        <p className="text-gray-400 text-[11px] mt-1">Opcional</p>
      </div>
    </div>
  )
}

/* ─── Step 2 — Ubicación ─────────────────────────────────────────────────────── */
function Step2({ data, set, zones }: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void; zones: Zone[]
}) {
  const addressRef     = useRef<HTMLInputElement>(null)
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef      = useRef<any>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY

  useEffect(() => {
    if (!hasKey) return
    if ((window as any).google?.maps) { setMapsReady(true); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) { existing.addEventListener('load', () => setMapsReady(true)); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`
    script.async = true; script.onload = () => setMapsReady(true)
    document.head.appendChild(script)
  }, [hasKey])

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    const center = { lat: data.location_lat ?? 4.711, lng: data.location_lng ?? -74.0721 }
    const map = new google.maps.Map(mapRef.current, { center, zoom: data.location_lat ? 16 : 12, disableDefaultUI: true, zoomControl: true })
    const marker = new google.maps.Marker({ position: center, map, draggable: true, visible: !!data.location_lat })
    marker.addListener('dragend', (e: any) => { set('location_lat', e.latLng.lat()); set('location_lng', e.latLng.lng()) })
    mapInstanceRef.current = map; markerRef.current = marker
  }, [mapsReady])

  useEffect(() => {
    if (!mapsReady || !addressRef.current) return
    const ac = new google.maps.places.Autocomplete(addressRef.current, {
      componentRestrictions: { country: 'co' }, fields: ['geometry', 'formatted_address'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      const lat = place.geometry.location.lat(); const lng = place.geometry.location.lng()
      set('address', place.formatted_address); set('location_lat', lat); set('location_lng', lng)
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter({ lat, lng }); mapInstanceRef.current.setZoom(17)
        markerRef.current.setPosition({ lat, lng }); markerRef.current.setVisible(true)
      }
    })
  }, [mapsReady])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Dirección <span className="text-[#25B3CC]">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input ref={addressRef} className={`${inputCls} pl-10`}
            placeholder={hasKey ? 'Busca la dirección de tu negocio' : 'Ingresa la dirección completa'}
            value={data.address} onChange={e => set('address', e.target.value)} />
        </div>
      </div>
      <div ref={mapRef} className="w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
        {!hasKey && <div className="flex items-center gap-2 text-gray-400 text-sm"><MapPin className="w-4 h-4" /> Mapa disponible con Google Maps API Key</div>}
      </div>
      {data.location_lat && <p className="text-gray-500 text-xs flex items-center gap-1.5"><Check className="w-3 h-3 text-[#25B3CC]" /> Puedes arrastrar el pin para afinar la posición.</p>}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Zona de Bogotá <span className="text-[#25B3CC]">*</span>
        </label>
        <div className="relative">
          <select className={`${selectCls} ${!data.zone_id ? 'text-gray-400' : ''}`}
            value={data.zone_id ?? ''} onChange={e => set('zone_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">Selecciona la zona</option>
            {zones.length === 0 && <option disabled>Cargando zonas...</option>}
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      {data.location_lat && data.location_lng && (
        <div className="flex items-center gap-2 bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-xl px-4 py-2.5">
          <Check className="w-4 h-4 text-[#25B3CC] shrink-0" />
          <span className="text-[#25B3CC] text-xs">Coordenadas: {data.location_lat.toFixed(5)}, {data.location_lng.toFixed(5)}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Step 3 — Horarios ──────────────────────────────────────────────────────── */
function Step3({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: any) => void }) {
  const updateHour = (weekday: number, field: keyof HourEntry, value: any) =>
    set('business_hours', data.business_hours.map(h => h.weekday === weekday ? { ...h, [field]: value } : h))

  return (
    <div>
      <p className="text-gray-500 text-sm mb-3">Indica los días y horarios en que atiendes.</p>
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[80px_48px_1fr_1fr] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Día','Abre','Desde','Hasta'].map(h => (
            <span key={h} className="text-gray-400 text-[11px] font-semibold uppercase text-center first:text-left">{h}</span>
          ))}
        </div>
        {data.business_hours.map((h, i) => (
          <div key={h.weekday} className={`grid grid-cols-[80px_48px_1fr_1fr] gap-2 items-center px-4 py-2.5 ${i < data.business_hours.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <span className={`text-sm font-medium ${h.open ? 'text-gray-800' : 'text-gray-400'}`}>{DAYS_LABELS[h.weekday - 1]}</span>
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
  )
}

/* ─── Step 4 — Contacto ──────────────────────────────────────────────────────── */
function Step4({ data, set, categories, zones }: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void
  categories: Category[]; zones: Zone[]
}) {
  const openDays     = data.business_hours.filter(h => h.open)
  const selectedCats = categories.filter(c => data.category_ids.includes(c.id))
  const selectedZone = zones.find(z => z.id === data.zone_id)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: Phone,         key: 'phone',     label: 'Teléfono',  placeholder: '+57 310 000 0000' },
          { icon: MessageCircle, key: 'whatsapp',  label: 'WhatsApp',  placeholder: '+57 310 000 0000' },
          { icon: Globe,         key: 'website',   label: 'Sitio web', placeholder: 'www.tunegocio.com' },
          { icon: Instagram,     key: 'instagram', label: 'Instagram', placeholder: '@tunegocio' },
        ].map(({ icon: Icon, key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
            <div className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className={`${inputCls} pl-10`} placeholder={placeholder}
                value={(data as any)[key]} onChange={e => set(key as keyof WizardData, e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-gray-400 text-xs">Mínimo un número de contacto — teléfono o WhatsApp.</p>
      <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#25B3CC]" />
          <span className="text-gray-800 text-sm font-semibold">Resumen</span>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Nombre',     value: data.business_name || '—' },
            { label: 'Categorías', value: selectedCats.map(c => c.name).join(', ') || '—' },
            { label: 'Dirección',  value: data.address || '—' },
            { label: 'Zona',       value: selectedZone?.name || '—' },
            { label: 'Días',       value: openDays.length > 0 ? `${openDays.length} día(s) de atención` : '—' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <span className="text-gray-400 text-xs">{row.label}</span>
              <span className="text-gray-800 text-xs font-medium max-w-[200px] text-right truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Step 5 — Imagen principal ──────────────────────────────────────────────── */
function Step5({ data, set, session }: { data: WizardData; set: (k: keyof WizardData, v: any) => void; session: any }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    try {
      const url = await uploadImage(file, session.user.id, 'main')
      set('main_image_url', url)
    } catch (err: any) {
      console.error('upload error (main):', err)
      setError(err?.message ?? 'Error al subir la imagen. Intenta de nuevo.')
    }
    setUploading(false)
  }

  return (
    <div>
      <p className="text-gray-500 text-sm mb-4">Foto principal que verán los usuarios en la app. Recomendado: 1200×800 px.</p>
      <label className={`block w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
        data.main_image_url ? 'border-[#25B3CC]/40' : 'border-gray-200 hover:border-[#25B3CC]/40'
      }`}>
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-[#25B3CC] animate-spin" />
            <p className="text-gray-500 text-sm">Subiendo imagen...</p>
          </div>
        ) : data.main_image_url ? (
          <div className="relative">
            <img src={data.main_image_url} alt="Imagen principal" className="w-full h-52 object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Cambiar imagen</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-700 text-sm font-medium">Haz click para subir una imagen</p>
              <p className="text-gray-400 text-xs mt-1">JPG, PNG o WebP · Máx. 5MB</p>
            </div>
          </div>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      </label>
      {error && (
        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

/* ─── Step 6 — Logo ──────────────────────────────────────────────────────────── */
function Step6({ data, set, session }: { data: WizardData; set: (k: keyof WizardData, v: any) => void; session: any }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    try {
      const url = await uploadImage(file, session.user.id, 'logo')
      set('logo_url', url)
    } catch (err: any) {
      console.error('upload error (logo):', err)
      setError(err?.message ?? 'Error al subir el logo. Intenta de nuevo.')
    }
    setUploading(false)
  }

  return (
    <div>
      <p className="text-gray-500 text-sm mb-4">Logo o ícono de tu negocio. Recomendado: imagen cuadrada 400×400 px.</p>
      <div className="flex items-start gap-5">
        <label className={`flex-shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
          data.logo_url ? 'border-[#25B3CC]/40' : 'border-gray-200 hover:border-[#25B3CC]/40'
        }`}>
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
          ) : data.logo_url ? (
            <img src={data.logo_url} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-gray-400 text-[10px] text-center leading-tight">Subir<br/>logo</span>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
        </label>
        <div className="flex-1 pt-2">
          <p className="text-gray-700 text-sm font-medium mb-1">
            {data.logo_url ? '✓ Logo subido' : 'Sube tu logo'}
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Haz click en el recuadro para seleccionar la imagen desde tu dispositivo.<br />
            JPG, PNG o WebP · Máx. 5MB
          </p>
          {data.logo_url && (
            <label className="mt-3 inline-flex items-center gap-1.5 text-[#25B3CC] text-xs font-medium cursor-pointer hover:text-[#1E9DB5] transition-colors">
              <Upload className="w-3.5 h-3.5" /> Cambiar logo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

/* ─── Step 7 — Servicios extra ───────────────────────────────────────────────── */
function Step7({ data, set, amenities, amenitiesLoaded }: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void
  amenities: Amenity[]; amenitiesLoaded: boolean
}) {
  const toggle = (id: number) => {
    const ids = data.amenity_ids
    set('amenity_ids', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  if (!amenitiesLoaded) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Cargando servicios...
    </div>
  )

  if (amenities.length === 0) return (
    <p className="text-gray-400 text-sm py-2">
      No hay servicios disponibles por ahora. Puedes continuar y enviar tu solicitud.
    </p>
  )

  return (
    <div>
      <p className="text-gray-500 text-sm mb-4">Selecciona los servicios y comodidades que ofrece tu negocio.</p>
      <div className="flex flex-wrap gap-2">
        {amenities.map(a => (
          <button key={a.id} type="button" onClick={() => toggle(a.id)} title={a.description}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              data.amenity_ids.includes(a.id)
                ? 'bg-[#25B3CC]/10 border-[#25B3CC] text-[#25B3CC]'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>{a.name}</button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN WIZARD
═══════════════════════════════════════════════════════════════════════════════ */
export default function RegisterWizard() {
  const navigate = useNavigate()

  const [authChecked,    setAuthChecked]    = useState(false)
  const [session,        setSession]        = useState<any>(null)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [data,           setData]           = useState<WizardData>(INITIAL_DATA)
  const [activeSection,  setActiveSection]  = useState<number | null>(0)
  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [completed,      setCompleted]      = useState<Set<number>>(new Set())
  const [sectionError,   setSectionError]   = useState<string | null>(null)
  const [submitting,     setSubmitting]     = useState(false)

  const [categories,      setCategories]      = useState<Category[]>([])
  const [zones,           setZones]           = useState<Zone[]>([])
  const [cuisineTypes,    setCuisineTypes]    = useState<CuisineType[]>([])
  const [amenities,       setAmenities]       = useState<Amenity[]>([])
  const [amenitiesLoaded, setAmenitiesLoaded] = useState(false)

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setAuthChecked(true)
      if (session) checkExisting(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      setSession(session)
      if (session) checkExisting(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkExisting = async (authId: string) => {
    const { data } = await supabase.from('business_registration').select('status').eq('auth_id', authId).maybeSingle()
    if (data) setExistingStatus(data.status)
  }

  /* ── Catalogs ── */
  useEffect(() => {
    if (!session) return
    Promise.all([
      supabase.from('category').select('id, name').order('name'),
      supabase.from('zone').select('id, name').eq('city', 'Bogotá').order('name'),
      supabase.from('cuisine_type').select('id, name').order('name'),
      supabase.from('additional_services').select('id, name, description').order('name'),
    ]).then(([cats, zns, ct, am]) => {
      if (cats.data) setCategories(cats.data)
      if (zns.data)  setZones(zns.data)
      if (ct.data)   setCuisineTypes(ct.data)
      if (am.error)  console.error('additional_service query error:', am.error)
      setAmenities(am.data ?? [])
      setAmenitiesLoaded(true)
    })
  }, [session])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserMenuOpen(false)
  }

  const set = useCallback((key: keyof WizardData, val: any) => {
    setData(prev => ({ ...prev, [key]: val }))
    setSectionError(null)
  }, [])

  /* ── Validation ── */
  const validate = (idx: number): string | null => {
    if (idx === 0) {
      if (!data.business_name.trim())     return 'El nombre del negocio es obligatorio.'
      if (data.category_ids.length === 0) return 'Selecciona al menos una categoría.'
      if (!data.description.trim())       return 'La descripción es obligatoria.'
    }
    if (idx === 1) {
      if (!data.address.trim()) return 'La dirección es obligatoria.'
      if (!data.zone_id)        return 'Selecciona la zona de Bogotá.'
    }
    if (idx === 2 && data.business_hours.filter(h => h.open).length === 0)
      return 'Selecciona al menos un día de atención.'
    if (idx === 3 && !data.phone.trim() && !data.whatsapp.trim())
      return 'Ingresa al menos un número de contacto.'
    if (idx === 4 && !data.main_image_url)
      return 'Sube una imagen principal para tu negocio.'
    if (idx === 5 && !data.logo_url)
      return 'Sube el logo de tu negocio.'
    return null
  }

  /* ── Summary ── */
  const getSummary = (idx: number): string => {
    if (idx === 0) return data.business_name
    if (idx === 1) return data.address.length > 50 ? data.address.slice(0, 50) + '…' : data.address
    if (idx === 2) { const o = data.business_hours.filter(h => h.open); return `${o.length} día${o.length !== 1 ? 's' : ''} de atención` }
    if (idx === 3) return data.phone || data.whatsapp || ''
    if (idx === 4) return data.main_image_url ? 'Imagen subida ✓' : ''
    if (idx === 5) return data.logo_url ? 'Logo subido ✓' : ''
    if (idx === 6) { const n = data.amenity_ids.length; return n > 0 ? `${n} servicio${n !== 1 ? 's' : ''} seleccionado${n !== 1 ? 's' : ''}` : 'Sin servicios' }
    return ''
  }

  const part1Complete = PART1_INDICES.every(i => completed.has(i))

  /* ── Header click ── */
  const handleHeaderClick = (idx: number) => {
    const isLocked = PART2_INDICES.includes(idx) && !part1Complete
    if (isLocked) return
    if (activeSection === idx) {
      setActiveSection(null)
    } else {
      if (completed.has(idx)) {
        setCompleted(prev => { const s = new Set(prev); s.delete(idx); return s })
      }
      setActiveSection(idx)
      setSectionError(null)
    }
  }

  const handleContinuar = (idx: number) => {
    const err = validate(idx)
    if (err) { setSectionError(err); return }
    setSectionError(null)
    setCompleted(prev => new Set([...prev, idx]))
    // Open next incomplete section
    const next = idx + 1
    if (next < SECTIONS.length) {
      const nextLocked = PART2_INDICES.includes(next) && !PART1_INDICES.every(i => i === idx ? true : completed.has(i))
      if (!nextLocked) setActiveSection(next)
      else setActiveSection(null)
    } else {
      setActiveSection(null)
    }
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true); setSectionError(null)
    const contacts = [
      data.phone     && { method: 'phone',     link: data.phone },
      data.whatsapp  && { method: 'whatsapp',  link: data.whatsapp },
      data.website   && { method: 'website',   link: data.website },
      data.instagram && { method: 'instagram', link: data.instagram },
    ].filter(Boolean)
    const businessHours = data.business_hours.filter(h => h.open).map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time }))
    const { error } = await supabase.from('business_registration').insert({
      auth_id: session.user.id, email: session.user.email,
      business_name: data.business_name, description: data.description,
      category_ids: data.category_ids, cuisine_type_ids: data.cuisine_type_ids,
      mean_price: data.mean_price ? Number(data.mean_price) : null,
      address: data.address, zone_id: data.zone_id,
      location_lat: data.location_lat, location_lng: data.location_lng,
      business_hours: businessHours, amenity_ids: data.amenity_ids, contacts,
      main_image_url: data.main_image_url || null,
      logo_url: data.logo_url || null,
    })
    setSubmitting(false)
    if (error) { setSectionError('Error al enviar. Por favor intenta de nuevo.'); console.error(error); return }
    navigate('/register/done')
  }

  /* ── Loading / Auth gates ── */
  if (!authChecked) return (
    <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
    </div>
  )
  if (!session) return <AuthScreen />

  if (existingStatus === 'pending') return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <div className="bg-[#25B3CC] px-6 py-5"><h1 className="text-white text-xl font-bold max-w-2xl mx-auto">Tu solicitud</h1></div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="w-16 h-16 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-gray-900 text-xl font-bold mb-3">Tu solicitud está en revisión</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">Nuestro equipo la está revisando y te contactaremos pronto.</p>
          <a href="/" className="text-[#25B3CC] hover:text-[#1E9DB5] text-sm font-medium">← Volver al inicio</a>
        </div>
      </div>
    </div>
  )

  if (existingStatus === 'approved') return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <div className="bg-[#25B3CC] px-6 py-5"><h1 className="text-white text-xl font-bold max-w-2xl mx-auto">Tu negocio en WAVI</h1></div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="w-16 h-16 rounded-full bg-[#25B3CC]/15 border-2 border-[#25B3CC] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[#25B3CC]" />
          </div>
          <h2 className="text-gray-900 text-xl font-bold mb-3">¡Ya estás en WAVI!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">Tu negocio ya fue aprobado y está activo en la plataforma.</p>
          <a href="/" className="text-[#25B3CC] hover:text-[#1E9DB5] text-sm font-medium">← Volver al inicio</a>
        </div>
      </div>
    </div>
  )

  const progressPct   = Math.round((completed.size / SECTIONS.length) * 100)
  const allComplete   = completed.size === SECTIONS.length

  const sectionContent: Record<number, React.ReactNode> = {
    0: <Step1 data={data} set={set} categories={categories} cuisineTypes={cuisineTypes} />,
    1: <Step2 data={data} set={set} zones={zones} />,
    2: <Step3 data={data} set={set} />,
    3: <Step4 data={data} set={set} categories={categories} zones={zones} />,
    4: <Step5 data={data} set={set} session={session} />,
    5: <Step6 data={data} set={set} session={session} />,
    6: <Step7 data={data} set={set} amenities={amenities} amenitiesLoaded={amenitiesLoaded} />,
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">

      {/* ── Teal header ── */}
      <div className="bg-[#25B3CC] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-white/80 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></a>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Información del negocio</p>
              <p className="text-white/75 text-xs">
                {completed.size} de {SECTIONS.length} completados · {progressPct}%
              </p>
            </div>
          </div>
          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center transition-all"
              title={session?.user?.email}
            >
              <span className="text-white text-xs font-bold uppercase">
                {session?.user?.email?.[0] ?? '?'}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Sesión iniciada como</p>
                  <p className="text-gray-800 text-sm font-medium truncate">{session?.user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors text-left"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="h-1 bg-white/20">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* ── Step dots ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[61px] z-10">
        <div className="max-w-2xl mx-auto px-5 py-3">
          <div className="flex items-center">
            {SECTIONS.map((s, i) => {
              const locked = PART2_INDICES.includes(i) && !part1Complete
              return (
                <React.Fragment key={s.label}>
                  <button type="button" disabled={locked}
                    onClick={() => handleHeaderClick(i)}
                    className={`flex flex-col items-center gap-1 flex-shrink-0 ${locked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      completed.has(i)   ? 'bg-green-500 border-green-500 text-white'
                      : i === activeSection ? 'bg-[#25B3CC] border-[#25B3CC] text-white'
                      :                      'bg-white border-gray-200 text-gray-400'
                    }`}>
                      {completed.has(i) ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className={`text-[9px] font-semibold uppercase tracking-wide hidden sm:block ${
                      i === activeSection ? 'text-[#25B3CC]'
                      : completed.has(i) ? 'text-green-500'
                      : 'text-gray-300'
                    }`}>{s.label}</span>
                  </button>
                  {i < SECTIONS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 transition-all duration-500 ${
                      i === 3 ? 'bg-[#25B3CC]/20 border-dashed' : completed.has(i) ? 'bg-green-300' : 'bg-gray-100'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-3 pb-12">
        <div className="mb-5">
          <h1 className="text-gray-900 text-xl font-bold">Cuéntanos sobre tu establecimiento</h1>
          <p className="text-gray-500 text-sm mt-1">Puedes completar las secciones en cualquier orden.</p>
        </div>

        {/* Part 1 */}
        {PART1_INDICES.map(i => (
          <AccordionSection key={i} index={i} title={SECTIONS[i].title} summary={getSummary(i)}
            isOpen={activeSection === i} isCompleted={completed.has(i)} isLocked={false}
            onHeaderClick={() => handleHeaderClick(i)}
            error={activeSection === i ? sectionError : null}>
            {sectionContent[i]}
            <ContinuarBtn onClick={() => handleContinuar(i)} />
          </AccordionSection>
        ))}

        {/* Part 2 divider */}
        <div className={`flex items-center gap-3 py-2 transition-all ${part1Complete ? 'opacity-100' : 'opacity-40'}`}>
          <div className="flex-1 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            part1Complete ? 'bg-[#25B3CC]/10 border-[#25B3CC]/30 text-[#25B3CC]' : 'bg-gray-100 border-gray-200 text-gray-400'
          }`}>
            {part1Complete ? <Check className="w-3.5 h-3.5" /> : <span>🔒</span>}
            Parte 2 — Imagen y servicios
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        {!part1Complete && (
          <p className="text-center text-gray-400 text-xs -mt-1">Completa las 4 secciones anteriores para continuar</p>
        )}

        {/* Part 2 */}
        {PART2_INDICES.map(i => {
          const locked = !part1Complete
          const isLast = i === 6
          return (
            <AccordionSection key={i} index={i} title={SECTIONS[i].title} summary={getSummary(i)}
              isOpen={activeSection === i} isCompleted={completed.has(i)} isLocked={locked}
              onHeaderClick={() => handleHeaderClick(i)}
              error={activeSection === i ? sectionError : null}>
              {sectionContent[i]}
              {!isLast ? (
                <ContinuarBtn onClick={() => handleContinuar(i)} />
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-xl px-4 py-3 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-[#25B3CC] shrink-0 mt-0.5" />
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Al enviar, tu solicitud queda en revisión. Te confirmaremos en máximo{' '}
                      <span className="text-gray-900 font-semibold">48 horas hábiles</span>.
                    </p>
                  </div>
                  {sectionError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-sm">{sectionError}</p>
                    </div>
                  )}
                  <button onClick={allComplete ? handleSubmit : () => handleContinuar(i)}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-70">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : allComplete
                      ? <><Sparkles className="w-4 h-4" /> Enviar solicitud</>
                      : <>Guardar y continuar <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}
            </AccordionSection>
          )
        })}

        {/* ── Submit bar — visible when all 7 complete ── */}
        {allComplete && (
          <div className="bg-white border border-[#25B3CC]/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#25B3CC] shrink-0 mt-0.5" />
              <p className="text-gray-600 text-sm leading-relaxed">
                Todo listo. Al enviar, tu solicitud queda en revisión y te confirmaremos en máximo{' '}
                <span className="text-gray-900 font-semibold">48 horas hábiles</span>.
              </p>
            </div>
            {sectionError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{sectionError}</p>
              </div>
            )}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-70">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                : <><Sparkles className="w-4 h-4" /> Enviar solicitud</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
