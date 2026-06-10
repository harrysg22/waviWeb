import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import {
  ChevronRight, ChevronLeft, Check, AlertCircle, Loader2,
  MapPin, Phone, Globe, Instagram, MessageCircle, Clock,
  CheckCircle2, Sparkles, X,
} from 'lucide-react'

/* ─── Google Maps global ───────────────────────────────────────────────────── */
declare const google: any

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Category    { id: number; name: string }
interface Zone        { id: number; name: string }
interface CuisineType { id: number; name: string }
interface Amenity     { id: number; name: string; description: string }

interface HourEntry {
  weekday:    number
  open:       boolean
  start_time: string
  end_time:   string
}

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
  business_name:    '',
  category_ids:     [],
  cuisine_type_ids: [],
  description:      '',
  mean_price:       '',
  address:          '',
  zone_id:          null,
  location_lat:     null,
  location_lng:     null,
  business_hours:   INITIAL_HOURS,
  amenity_ids:      [],
  phone:            '',
  whatsapp:         '',
  website:          '',
  instagram:        '',
}

/* ─── Time options — "H:MM AM/PM" format required by Flutter app ───────────── */
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
const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/* ─── Shared styles (matches WaviBusinessModal) ────────────────────────────── */
const inputCls  = 'w-full bg-white/5 border border-white/12 hover:border-white/20 focus:border-[#25B3CC]/60 focus:bg-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-[#25B3CC]/20'
const selectCls = 'w-full bg-white/5 border border-white/12 hover:border-white/20 focus:border-[#25B3CC]/60 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 appearance-none cursor-pointer text-white focus:ring-1 focus:ring-[#25B3CC]/20'
const labelCls  = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

/* ─── Field wrapper ─────────────────────────────────────────────────────────── */
const Field: React.FC<{
  label: string; required?: boolean; children: React.ReactNode; className?: string
}> = ({ label, required, children, className = '' }) => (
  <div className={className}>
    <label className={labelCls}>
      {label}{required && <span className="text-[#25B3CC] ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

/* ─── Step indicator ────────────────────────────────────────────────────────── */
const StepIndicator: React.FC<{
  current: number; total: number; titles: string[]
}> = ({ current, total, titles }) => (
  <div className="flex items-center gap-0 w-full">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
            ${i < current  ? 'bg-[#25B3CC] border-[#25B3CC] text-white'
            : i === current ? 'bg-[#25B3CC]/15 border-[#25B3CC] text-[#25B3CC]'
            :                 'bg-white/5 border-white/15 text-gray-600'}`}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-[9px] font-semibold uppercase tracking-wider hidden sm:block whitespace-nowrap
            ${i === current ? 'text-[#25B3CC]' : i < current ? 'text-gray-400' : 'text-gray-600'}`}>
            {titles[i]}
          </span>
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-px mx-1 transition-all duration-500 ${i < current ? 'bg-[#25B3CC]' : 'bg-white/10'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
)

/* ═══════════════════════════════════════════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════════════════════════════════════════ */
const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const signIn = async (provider: 'google' | 'apple') => {
    setLoading(provider)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/register` },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-[#0D1117] px-6"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#25B3CC]/6 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[#25B3CC] flex items-center justify-center shadow-[0_0_30px_rgba(37,179,204,0.4)] mx-auto mb-5">
            <span className="text-white text-xs font-bold tracking-tight">WAVI</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
            Registra tu negocio en WAVI
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            Conecta con miles de personas buscando experiencias en Bogotá.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn('google')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-6 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>

          <button
            onClick={() => signIn('apple')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/12 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading === 'apple' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.77 3.15.8 1.2-.24 2.35-1 3.62-.84 1.55.2 2.7.88 3.42 2.26-3.13 1.83-2.39 5.88.73 7.17-.61 1.62-1.4 3.17-2.92 3.49zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            Continuar con Apple
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-6 leading-relaxed">
          Al continuar aceptas nuestros{' '}
          <a href="/terminos-y-condiciones" className="text-[#25B3CC] hover:underline">Términos</a>
          {' '}y{' '}
          <a href="/politica-de-privacidad" className="text-[#25B3CC] hover:underline">Política de Privacidad</a>
        </p>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">← Volver al inicio</a>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 1 — Negocio
═══════════════════════════════════════════════════════════════════════════════ */
function Step1({
  data, set, categories, cuisineTypes,
}: {
  data: WizardData
  set: (k: keyof WizardData, v: any) => void
  categories: Category[]
  cuisineTypes: CuisineType[]
}) {
  const toggle = (key: 'category_ids' | 'cuisine_type_ids', id: number) => {
    const arr = data[key] as number[]
    set(key, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
  }

  return (
    <div className="space-y-6">
      <Field label="Nombre del negocio" required>
        <input
          className={inputCls}
          placeholder="Ej. El Rincón Bogotano"
          value={data.business_name}
          onChange={e => set('business_name', e.target.value)}
          maxLength={100}
        />
      </Field>

      <div>
        <label className={labelCls}>
          Categorías<span className="text-[#25B3CC] ml-0.5">*</span>
        </label>
        {categories.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando categorías...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle('category_ids', cat.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  data.category_ids.includes(cat.id)
                    ? 'bg-[#25B3CC]/15 border-[#25B3CC]/60 text-[#25B3CC]'
                    : 'bg-white/4 border-white/10 text-gray-400 hover:border-white/25'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {cuisineTypes.length > 0 && (
        <div>
          <label className={labelCls}>Tipo de cocina</label>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map(ct => (
              <button
                key={ct.id}
                type="button"
                onClick={() => toggle('cuisine_type_ids', ct.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  data.cuisine_type_ids.includes(ct.id)
                    ? 'bg-[#25B3CC]/15 border-[#25B3CC]/60 text-[#25B3CC]'
                    : 'bg-white/4 border-white/10 text-gray-400 hover:border-white/25'
                }`}
              >
                {ct.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Field label="Descripción del negocio" required>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder="Describe qué hace especial a tu negocio, qué experiencia ofreces..."
          value={data.description}
          onChange={e => set('description', e.target.value)}
          maxLength={500}
        />
        <div className="text-right text-gray-600 text-[10px] mt-1">{data.description.length}/500</div>
      </Field>

      <Field label="Precio promedio por persona (COP)">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            className={`${inputCls} pl-7`}
            type="number"
            placeholder="Ej. 45000"
            value={data.mean_price}
            onChange={e => set('mean_price', e.target.value)}
            min="0"
          />
        </div>
        <p className="text-gray-600 text-[10px] mt-1">Precio aproximado por persona (opcional)</p>
      </Field>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 2 — Ubicación
═══════════════════════════════════════════════════════════════════════════════ */
function Step2({
  data, set, zones,
}: {
  data: WizardData
  set: (k: keyof WizardData, v: any) => void
  zones: Zone[]
}) {
  const addressRef    = useRef<HTMLInputElement>(null)
  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef     = useRef<any>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY

  /* Load Maps JS API once */
  useEffect(() => {
    if (!hasKey) return
    if ((window as any).google?.maps) { setMapsReady(true); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) { existing.addEventListener('load', () => setMapsReady(true)); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`
    script.async = true
    script.onload = () => setMapsReady(true)
    document.head.appendChild(script)
  }, [hasKey])

  /* Initialize map */
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    const center = { lat: data.location_lat ?? 4.711, lng: data.location_lng ?? -74.0721 }
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: data.location_lat ? 16 : 12,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: 'geometry',            stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill',    stylers: [{ color: '#8a9bb0' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
        { featureType: 'road',  elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
      ],
    })
    const marker = new google.maps.Marker({
      position: center,
      map,
      draggable: true,
      visible: !!data.location_lat,
    })
    marker.addListener('dragend', (e: any) => {
      set('location_lat', e.latLng.lat())
      set('location_lng', e.latLng.lng())
    })
    mapInstanceRef.current = map
    markerRef.current = marker
  }, [mapsReady])

  /* Initialize autocomplete */
  useEffect(() => {
    if (!mapsReady || !addressRef.current) return
    const ac = new google.maps.places.Autocomplete(addressRef.current, {
      componentRestrictions: { country: 'co' },
      fields: ['geometry', 'formatted_address'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      set('address',      place.formatted_address)
      set('location_lat', lat)
      set('location_lng', lng)
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter({ lat, lng })
        mapInstanceRef.current.setZoom(17)
        markerRef.current.setPosition({ lat, lng })
        markerRef.current.setVisible(true)
      }
    })
  }, [mapsReady])

  return (
    <div className="space-y-5">
      <Field label="Dirección del negocio" required>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            ref={addressRef}
            className={`${inputCls} pl-10`}
            placeholder={hasKey ? 'Busca la dirección de tu negocio' : 'Ingresa la dirección completa'}
            value={data.address}
            onChange={e => set('address', e.target.value)}
          />
        </div>
        {!hasKey && (
          <p className="text-yellow-500/70 text-[11px] mt-1">
            Configura VITE_GOOGLE_MAPS_KEY en .env.local para habilitar el autocompletado de dirección.
          </p>
        )}
      </Field>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-white/4 flex items-center justify-center"
      >
        {!hasKey && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <MapPin className="w-4 h-4" />
            Mapa disponible con Google Maps API Key
          </div>
        )}
      </div>

      {data.location_lat && (
        <p className="text-gray-600 text-[11px] -mt-2 flex items-center gap-1.5">
          <Check className="w-3 h-3 text-[#25B3CC]" />
          Puedes arrastrar el pin para afinar la posición exacta.
        </p>
      )}

      <Field label="Zona de Bogotá" required>
        <div className="relative">
          <select
            className={`${selectCls} ${!data.zone_id ? 'text-gray-500' : ''}`}
            value={data.zone_id ?? ''}
            onChange={e => set('zone_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="" className="bg-[#0E1419] text-gray-400">Selecciona la zona</option>
            {zones.length === 0 && (
              <option disabled className="bg-[#0E1419] text-gray-500">Cargando zonas...</option>
            )}
            {zones.map(z => (
              <option key={z.id} value={z.id} className="bg-[#0E1419] text-white">{z.name}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
        </div>
      </Field>

      {data.location_lat && data.location_lng && (
        <div className="flex items-center gap-2 bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-xl px-4 py-2.5">
          <Check className="w-4 h-4 text-[#25B3CC] shrink-0" />
          <span className="text-[#25B3CC] text-xs">
            Coordenadas: {data.location_lat.toFixed(5)}, {data.location_lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 3 — Horarios & Comodidades
═══════════════════════════════════════════════════════════════════════════════ */
function Step3({
  data, set, amenities,
}: {
  data: WizardData
  set: (k: keyof WizardData, v: any) => void
  amenities: Amenity[]
}) {
  const updateHour = (weekday: number, field: keyof HourEntry, value: any) =>
    set('business_hours', data.business_hours.map(h =>
      h.weekday === weekday ? { ...h, [field]: value } : h
    ))

  const toggleAmenity = (id: number) => {
    const ids = data.amenity_ids
    set('amenity_ids', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={labelCls}>
          Horarios de atención<span className="text-[#25B3CC] ml-0.5">*</span>
        </label>
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[72px_42px_1fr_1fr] gap-2 px-4 py-2 border-b border-white/8 bg-white/3">
            <span className="text-gray-600 text-[10px] uppercase font-semibold">Día</span>
            <span className="text-gray-600 text-[10px] uppercase font-semibold text-center">Abierto</span>
            <span className="text-gray-600 text-[10px] uppercase font-semibold text-center">Abre</span>
            <span className="text-gray-600 text-[10px] uppercase font-semibold text-center">Cierra</span>
          </div>
          {data.business_hours.map((h, i) => (
            <div
              key={h.weekday}
              className={`grid grid-cols-[72px_42px_1fr_1fr] gap-2 items-center px-4 py-2.5 ${
                i < data.business_hours.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <span className={`text-sm font-medium ${h.open ? 'text-white' : 'text-gray-600'}`}>
                {DAYS_LABELS[h.weekday - 1]}
              </span>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => updateHour(h.weekday, 'open', !h.open)}
                  className={`w-9 h-5 rounded-full transition-all duration-300 relative flex-shrink-0 ${
                    h.open ? 'bg-[#25B3CC]' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                    h.open ? 'left-4' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {h.open ? (
                <>
                  <select
                    className="bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-white text-xs outline-none focus:border-[#25B3CC]/40 appearance-none"
                    value={h.start_time}
                    onChange={e => updateHour(h.weekday, 'start_time', e.target.value)}
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0E1419]">{t}</option>)}
                  </select>
                  <select
                    className="bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-white text-xs outline-none focus:border-[#25B3CC]/40 appearance-none"
                    value={h.end_time}
                    onChange={e => updateHour(h.weekday, 'end_time', e.target.value)}
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0E1419]">{t}</option>)}
                  </select>
                </>
              ) : (
                <span className="col-span-2 text-gray-600 text-xs text-center">Cerrado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {amenities.length > 0 && (
        <div>
          <label className={labelCls}>Comodidades y servicios</label>
          <div className="flex flex-wrap gap-2">
            {amenities.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAmenity(a.id)}
                title={a.description}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  data.amenity_ids.includes(a.id)
                    ? 'bg-[#25B3CC]/15 border-[#25B3CC]/60 text-[#25B3CC]'
                    : 'bg-white/4 border-white/10 text-gray-400 hover:border-white/25'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {amenities.length === 0 && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando comodidades...
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 4 — Contacto + Resumen
═══════════════════════════════════════════════════════════════════════════════ */
function Step4({
  data, set, categories, zones,
}: {
  data: WizardData
  set: (k: keyof WizardData, v: any) => void
  categories: Category[]
  zones: Zone[]
}) {
  const openDays     = data.business_hours.filter(h => h.open)
  const selectedCats = categories.filter(c => data.category_ids.includes(c.id))
  const selectedZone = zones.find(z => z.id === data.zone_id)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Información de contacto</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teléfono">
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className={`${inputCls} pl-10`} placeholder="+57 310 000 0000"
                value={data.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </Field>
          <Field label="WhatsApp">
            <div className="relative">
              <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className={`${inputCls} pl-10`} placeholder="+57 310 000 0000"
                value={data.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
            </div>
          </Field>
          <Field label="Sitio web">
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className={`${inputCls} pl-10`} placeholder="www.tunegocio.com"
                value={data.website} onChange={e => set('website', e.target.value)} />
            </div>
          </Field>
          <Field label="Instagram">
            <div className="relative">
              <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className={`${inputCls} pl-10`} placeholder="@tunegocio"
                value={data.instagram} onChange={e => set('instagram', e.target.value)} />
            </div>
          </Field>
        </div>
        <p className="text-gray-600 text-xs">Mínimo un número de contacto — teléfono o WhatsApp.</p>
      </div>

      {/* Summary */}
      <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#25B3CC]" />
          <span className="text-white text-sm font-semibold">Resumen de tu solicitud</span>
        </div>
        <div className="divide-y divide-white/6">
          {[
            { label: 'Nombre',     value: data.business_name || '—' },
            { label: 'Categorías', value: selectedCats.map(c => c.name).join(', ') || '—' },
            { label: 'Dirección',  value: data.address || '—' },
            { label: 'Zona',       value: selectedZone?.name || '—' },
            { label: 'Días',       value: openDays.length > 0 ? `${openDays.length} día(s) de atención` : '—' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <span className="text-gray-500 text-xs">{row.label}</span>
              <span className="text-white text-xs font-medium max-w-[200px] text-right truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#25B3CC] shrink-0 mt-0.5" />
        <p className="text-gray-400 text-sm leading-relaxed">
          Al enviar, tu solicitud queda en revisión. Te confirmaremos en un máximo de{' '}
          <span className="text-white font-semibold">48 horas hábiles</span>.
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN WIZARD
═══════════════════════════════════════════════════════════════════════════════ */
export default function RegisterWizard() {
  const navigate = useNavigate()

  const [authChecked,     setAuthChecked]     = useState(false)
  const [session,         setSession]         = useState<any>(null)
  const [existingStatus,  setExistingStatus]  = useState<string | null>(null)
  const [step,            setStep]            = useState(0)
  const [data,            setData]            = useState<WizardData>(INITIAL_DATA)
  const [error,           setError]           = useState<string | null>(null)
  const [submitting,      setSubmitting]      = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  /* Catalog */
  const [categories,  setCategories]  = useState<Category[]>([])
  const [zones,       setZones]       = useState<Zone[]>([])
  const [cuisineTypes,setCuisineTypes]= useState<CuisineType[]>([])
  const [amenities,   setAmenities]   = useState<Amenity[]>([])

  const TOTAL      = 4
  const stepTitles = ['Negocio', 'Ubicación', 'Horarios', 'Contacto']
  const stepSubtitles = [
    'Cuéntanos sobre tu establecimiento',
    'Dónde está tu negocio en Bogotá',
    'Cuándo atiendes y qué ofreces',
    'Cómo contactarte — revisa y envía',
  ]

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthChecked(true)
      if (session) checkExisting(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) checkExisting(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkExisting = async (authId: string) => {
    const { data } = await supabase
      .from('business_registration')
      .select('status')
      .eq('auth_id', authId)
      .maybeSingle()
    if (data) setExistingStatus(data.status)
  }

  /* ── Load catalogs once authenticated ── */
  useEffect(() => {
    if (!session) return
    Promise.all([
      supabase.from('category').select('id, name').order('name'),
      supabase.from('zone').select('id, name').eq('city', 'Bogotá').order('name'),
      supabase.from('cuisine_type').select('id, name').order('name'),
      supabase.from('additional_service').select('id, name, description').order('name'),
    ]).then(([cats, zns, ct, am]) => {
      if (cats.data) setCategories(cats.data)
      if (zns.data)  setZones(zns.data)
      if (ct.data)   setCuisineTypes(ct.data)
      if (am.data)   setAmenities(am.data)
    })
  }, [session])

  const set = useCallback((key: keyof WizardData, val: any) => {
    setData(prev => ({ ...prev, [key]: val }))
    setError(null)
  }, [])

  /* ── Validation ── */
  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!data.business_name.trim())    return 'El nombre del negocio es obligatorio.'
      if (data.category_ids.length === 0) return 'Selecciona al menos una categoría.'
      if (!data.description.trim())      return 'La descripción es obligatoria.'
    }
    if (s === 1) {
      if (!data.address.trim()) return 'La dirección es obligatoria.'
      if (!data.zone_id)        return 'Selecciona la zona de Bogotá.'
    }
    if (s === 2) {
      if (data.business_hours.filter(h => h.open).length === 0)
        return 'Selecciona al menos un día de atención.'
    }
    if (s === 3) {
      if (!data.phone.trim() && !data.whatsapp.trim())
        return 'Ingresa al menos un número de contacto (teléfono o WhatsApp).'
    }
    return null
  }

  const handleNext = () => {
    const err = validate(step)
    if (err) { setError(err); return }
    setStep(s => s + 1)
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const handleBack = () => {
    setStep(s => s - 1)
    setError(null)
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    const err = validate(step)
    if (err) { setError(err); return }
    setSubmitting(true)
    setError(null)

    const contacts = [
      data.phone     && { method: 'phone',     link: data.phone },
      data.whatsapp  && { method: 'whatsapp',  link: data.whatsapp },
      data.website   && { method: 'website',   link: data.website },
      data.instagram && { method: 'instagram', link: data.instagram },
    ].filter(Boolean)

    const businessHours = data.business_hours
      .filter(h => h.open)
      .map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time }))

    const { error } = await supabase.from('business_registration').insert({
      auth_id:          session.user.id,
      email:            session.user.email,
      business_name:    data.business_name,
      description:      data.description,
      category_ids:     data.category_ids,
      cuisine_type_ids: data.cuisine_type_ids,
      mean_price:       data.mean_price ? Number(data.mean_price) : null,
      address:          data.address,
      zone_id:          data.zone_id,
      location_lat:     data.location_lat,
      location_lng:     data.location_lng,
      business_hours:   businessHours,
      amenity_ids:      data.amenity_ids,
      contacts,
    })

    setSubmitting(false)
    if (error) {
      setError('Error al enviar la solicitud. Por favor intenta de nuevo.')
      console.error(error)
      return
    }
    navigate('/register/done')
  }

  /* ── Render ── */
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthScreen />

  if (existingStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-yellow-400/15 border-2 border-yellow-400/40 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-3">Tu solicitud está en revisión</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Ya enviaste una solicitud. Nuestro equipo la está revisando y te contactaremos pronto.
          </p>
          <a href="/" className="text-[#25B3CC] hover:text-[#7FDAEB] text-sm transition-colors">← Volver al inicio</a>
        </div>
      </div>
    )
  }

  if (existingStatus === 'approved') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#25B3CC]/15 border-2 border-[#25B3CC] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[#25B3CC]" />
          </div>
          <h2 className="text-white text-xl font-bold mb-3">¡Ya estás en WAVI!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">Tu negocio ya fue aprobado y está activo en la plataforma.</p>
          <a href="/" className="text-[#25B3CC] hover:text-[#7FDAEB] text-sm transition-colors">← Volver al inicio</a>
        </div>
      </div>
    )
  }

  const steps = [
    <Step1 key={0} data={data} set={set} categories={categories} cuisineTypes={cuisineTypes} />,
    <Step2 key={1} data={data} set={set} zones={zones} />,
    <Step3 key={2} data={data} set={set} amenities={amenities} />,
    <Step4 key={3} data={data} set={set} categories={categories} zones={zones} />,
  ]

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-start py-8 px-4">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#25B3CC]/5 rounded-full blur-[100px] pointer-events-none" />

      <div
        className="relative w-full max-w-2xl flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
        style={{ background: 'linear-gradient(145deg, #0D1117 0%, #0A0E14 50%, #080C12 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#25B3CC]/8 rounded-full blur-[60px] pointer-events-none" />

        {/* ── Header ── */}
        <div className="relative z-10 px-6 pt-6 pb-5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25B3CC] flex items-center justify-center shadow-[0_0_20px_rgba(37,179,204,0.35)]">
                <span className="text-white text-[9px] font-bold tracking-tight">WAVI</span>
              </div>
              <div>
                <div className="text-white font-bold text-base tracking-tight">WAVI Business</div>
                <div className="text-[#25B3CC] text-[11px] font-medium">Registro de Partner</div>
              </div>
            </div>
            <a
              href="/"
              className="w-8 h-8 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/12 transition-all"
            >
              <X className="w-4 h-4" />
            </a>
          </div>

          <StepIndicator current={step} total={TOTAL} titles={stepTitles} />

          <div className="mt-5">
            <h2 className="text-white font-bold text-lg tracking-tight">{stepSubtitles[step]}</h2>
            <p className="text-gray-500 text-xs mt-0.5">Paso {step + 1} de {TOTAL}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div ref={scrollRef} className="relative z-10 overflow-y-auto flex-1 px-6 py-5 custom-scrollbar" style={{ maxHeight: '60vh' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="relative z-10 mx-6 mb-1 flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <div className="relative z-10 px-6 py-4 border-t border-white/8 flex-shrink-0 flex items-center justify-between gap-4 bg-[#08090D]/60">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all
              ${step === 0
                ? 'border-white/8 text-gray-700 cursor-not-allowed'
                : 'border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-5 h-1.5 bg-[#25B3CC]'
                  : i < step  ? 'w-1.5 h-1.5 bg-[#25B3CC]/50'
                  :             'w-1.5 h-1.5 bg-white/12'
                }`}
              />
            ))}
          </div>

          {step < TOTAL - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_16px_rgba(37,179,204,0.25)] hover:shadow-[0_0_24px_rgba(37,179,204,0.4)]"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_16px_rgba(37,179,204,0.25)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Enviar Solicitud</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
