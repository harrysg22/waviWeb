import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import {
  ChevronDown, ChevronUp, Check, AlertCircle, Loader2,
  MapPin, Phone, Globe, Instagram, MessageCircle, Clock,
  CheckCircle2, Sparkles, ArrowLeft, ChevronRight,
} from 'lucide-react'

declare const google: any

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface Category    { id: number; name: string }
interface Zone        { id: number; name: string }
interface CuisineType { id: number; name: string }
interface Amenity     { id: number; name: string; description: string }

interface HourEntry {
  weekday: number; open: boolean; start_time: string; end_time: string
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
  business_name: '', category_ids: [], cuisine_type_ids: [],
  description: '', mean_price: '', address: '', zone_id: null,
  location_lat: null, location_lng: null, business_hours: INITIAL_HOURS,
  amenity_ids: [], phone: '', whatsapp: '', website: '', instagram: '',
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
const TIME_OPTIONS  = generateTimeOptions()
const DAYS_LABELS   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/* ─── Light styles ───────────────────────────────────────────────────────────── */
const inputCls  = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition-all focus:ring-2 focus:ring-[#25B3CC]/15'
const selectCls = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none cursor-pointer text-gray-900 focus:ring-2 focus:ring-[#25B3CC]/15'

/* ─── Sections config ────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'nombre',      label: 'NOMBRE',      title: 'Nombre del negocio' },
  { id: 'categorias',  label: 'CATEGORÍAS',  title: 'Categorías' },
  { id: 'horario',     label: 'HORARIO',     title: 'Horario de atención' },
  { id: 'ubicacion',   label: 'UBICACIÓN',   title: 'Ubicación' },
  { id: 'descripcion', label: 'DESCRIPCIÓN', title: 'Descripción del negocio' },
  { id: 'contactos',   label: 'CONTACTO',    title: 'Contactos' },
]

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
              <button
                onClick={() => signIn('google')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-all disabled:opacity-70"
              >
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

              <button
                onClick={() => signIn('apple')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-70"
              >
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

/* ─── Accordion Section wrapper ──────────────────────────────────────────────── */
function AccordionSection({
  index, title, summary, isActive, isCompleted, isLocked,
  onEdit, children, error,
}: {
  index:       number
  title:       string
  summary:     string
  isActive:    boolean
  isCompleted: boolean
  isLocked:    boolean
  onEdit:      () => void
  children:    React.ReactNode
  error?:      string | null
}) {
  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isActive    ? 'border-[#25B3CC]/60 shadow-sm shadow-[#25B3CC]/10'
      : isCompleted ? 'border-green-200'
      : 'border-gray-100'
    }`}>
      {/* Section header */}
      <div className={`flex items-center gap-3 px-5 py-4 ${isCompleted ? 'bg-green-50 rounded-2xl' : ''} ${isActive ? 'border-b border-[#25B3CC]/15' : ''}`}>
        {/* Circle */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all ${
          isCompleted ? 'bg-green-500 text-white'
          : isActive  ? 'bg-[#25B3CC] text-white'
          : 'bg-gray-100 text-gray-400'
        }`}>
          {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
        </div>

        {/* Title + summary */}
        <div className="flex-1 min-w-0">
          <span className={`font-semibold text-sm ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
            {title}
          </span>
          {isCompleted && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">{summary}</p>
          )}
        </div>

        {/* Edit or chevron */}
        {isCompleted ? (
          <button
            onClick={onEdit}
            className="text-[#25B3CC] text-xs font-semibold hover:text-[#1E9DB5] transition-colors flex-shrink-0"
          >
            EDITAR
          </button>
        ) : isActive ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {isActive && (
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

/* ─── Continuar button ───────────────────────────────────────────────────────── */
function ContinuarBtn({ onClick, loading = false, label = 'Continuar' }: {
  onClick: () => void; loading?: boolean; label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all mt-5 disabled:opacity-70"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
        <>{label} <ChevronRight className="w-4 h-4" /></>
      )}
    </button>
  )
}

/* ─── Section 1 — Nombre ─────────────────────────────────────────────────────── */
function SectionNombre({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: any) => void }) {
  return (
    <div>
      <p className="text-gray-500 text-sm mb-3">Nombre que aparecerá en la app</p>
      <input
        className={inputCls}
        placeholder="Ej. Bolera La Estación"
        value={data.business_name}
        onChange={e => set('business_name', e.target.value)}
        maxLength={100}
        autoFocus
      />
    </div>
  )
}

/* ─── Section 2 — Categorías ─────────────────────────────────────────────────── */
function SectionCategorias({
  data, set, categories, cuisineTypes,
}: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void
  categories: Category[]; cuisineTypes: CuisineType[]
}) {
  const toggle = (key: 'category_ids' | 'cuisine_type_ids', id: number) => {
    const arr = data[key] as number[]
    set(key, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
  }

  if (categories.length === 0) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Cargando categorías...
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-500 text-sm mb-3">¿Qué ofreces? Puedes elegir una o varias.</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id} type="button"
              onClick={() => toggle('category_ids', cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                data.category_ids.includes(cat.id)
                  ? 'bg-[#25B3CC]/10 border-[#25B3CC] text-[#25B3CC]'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {cuisineTypes.length > 0 && (
        <div>
          <p className="text-gray-500 text-sm mb-3">Tipo de cocina (opcional)</p>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map(ct => (
              <button
                key={ct.id} type="button"
                onClick={() => toggle('cuisine_type_ids', ct.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  data.cuisine_type_ids.includes(ct.id)
                    ? 'bg-[#25B3CC]/10 border-[#25B3CC] text-[#25B3CC]'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {ct.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section 3 — Horario ────────────────────────────────────────────────────── */
function SectionHorario({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: any) => void }) {
  const updateHour = (weekday: number, field: keyof HourEntry, value: any) =>
    set('business_hours', data.business_hours.map(h =>
      h.weekday === weekday ? { ...h, [field]: value } : h
    ))

  return (
    <div>
      <p className="text-gray-500 text-sm mb-3">Indica los días y horarios en que atiendes.</p>
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[80px_48px_1fr_1fr] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-gray-400 text-[11px] font-semibold uppercase">Día</span>
          <span className="text-gray-400 text-[11px] font-semibold uppercase text-center">Abre</span>
          <span className="text-gray-400 text-[11px] font-semibold uppercase text-center">Desde</span>
          <span className="text-gray-400 text-[11px] font-semibold uppercase text-center">Hasta</span>
        </div>
        {data.business_hours.map((h, i) => (
          <div
            key={h.weekday}
            className={`grid grid-cols-[80px_48px_1fr_1fr] gap-2 items-center px-4 py-2.5 ${
              i < data.business_hours.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <span className={`text-sm font-medium ${h.open ? 'text-gray-800' : 'text-gray-400'}`}>
              {DAYS_LABELS[h.weekday - 1]}
            </span>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => updateHour(h.weekday, 'open', !h.open)}
                className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${
                  h.open ? 'bg-[#25B3CC]' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  h.open ? 'left-4' : 'left-0.5'
                }`} />
              </button>
            </div>

            {h.open ? (
              <>
                <select
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 text-xs outline-none focus:border-[#25B3CC] appearance-none"
                  value={h.start_time}
                  onChange={e => updateHour(h.weekday, 'start_time', e.target.value)}
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 text-xs outline-none focus:border-[#25B3CC] appearance-none"
                  value={h.end_time}
                  onChange={e => updateHour(h.weekday, 'end_time', e.target.value)}
                >
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

/* ─── Section 4 — Ubicación ──────────────────────────────────────────────────── */
function SectionUbicacion({
  data, set, zones,
}: {
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
    script.async = true
    script.onload = () => setMapsReady(true)
    document.head.appendChild(script)
  }, [hasKey])

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    const center = { lat: data.location_lat ?? 4.711, lng: data.location_lng ?? -74.0721 }
    const map = new google.maps.Map(mapRef.current, {
      center, zoom: data.location_lat ? 16 : 12,
      disableDefaultUI: true, zoomControl: true,
    })
    const marker = new google.maps.Marker({
      position: center, map, draggable: true, visible: !!data.location_lat,
    })
    marker.addListener('dragend', (e: any) => {
      set('location_lat', e.latLng.lat())
      set('location_lng', e.latLng.lng())
    })
    mapInstanceRef.current = map
    markerRef.current = marker
  }, [mapsReady])

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
      set('address', place.formatted_address)
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
    <div className="space-y-4">
      <div>
        <p className="text-gray-500 text-sm mb-3">¿Dónde está tu negocio en Bogotá?</p>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={addressRef}
            className={`${inputCls} pl-10`}
            placeholder={hasKey ? 'Busca la dirección de tu negocio' : 'Ingresa la dirección completa'}
            value={data.address}
            onChange={e => set('address', e.target.value)}
          />
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
      >
        {!hasKey && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" /> Mapa disponible con Google Maps API Key
          </div>
        )}
      </div>

      <div className="relative">
        <select
          className={`${selectCls} ${!data.zone_id ? 'text-gray-400' : ''}`}
          value={data.zone_id ?? ''}
          onChange={e => set('zone_id', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecciona la zona de Bogotá</option>
          {zones.length === 0 && <option disabled>Cargando zonas...</option>}
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

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

/* ─── Section 5 — Descripción ────────────────────────────────────────────────── */
function SectionDescripcion({
  data, set, amenities,
}: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void; amenities: Amenity[]
}) {
  const toggleAmenity = (id: number) => {
    const ids = data.amenity_ids
    set('amenity_ids', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-500 text-sm mb-3">Cuéntanos qué hace especial a tu negocio.</p>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder="Describe qué experiencia ofreces, qué te diferencia..."
          value={data.description}
          onChange={e => set('description', e.target.value)}
          maxLength={500}
        />
        <div className="text-right text-gray-400 text-[11px] mt-1">{data.description.length}/500</div>
      </div>

      <div>
        <p className="text-gray-500 text-sm mb-2">Precio promedio por persona (COP) — opcional</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            className={`${inputCls} pl-7`}
            type="number" placeholder="Ej. 45000"
            value={data.mean_price}
            onChange={e => set('mean_price', e.target.value)}
            min="0"
          />
        </div>
      </div>

      {amenities.length > 0 && (
        <div>
          <p className="text-gray-500 text-sm mb-3">Comodidades y servicios (opcional)</p>
          <div className="flex flex-wrap gap-2">
            {amenities.map(a => (
              <button
                key={a.id} type="button"
                onClick={() => toggleAmenity(a.id)}
                title={a.description}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  data.amenity_ids.includes(a.id)
                    ? 'bg-[#25B3CC]/10 border-[#25B3CC] text-[#25B3CC]'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section 6 — Contactos ──────────────────────────────────────────────────── */
function SectionContactos({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: any) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">Mínimo un número de contacto.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: Phone,         key: 'phone',     label: 'Teléfono',   placeholder: '+57 310 000 0000' },
          { icon: MessageCircle, key: 'whatsapp',  label: 'WhatsApp',   placeholder: '+57 310 000 0000' },
          { icon: Globe,         key: 'website',   label: 'Sitio web',  placeholder: 'www.tunegocio.com' },
          { icon: Instagram,     key: 'instagram', label: 'Instagram',  placeholder: '@tunegocio' },
        ].map(({ icon: Icon, key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
            <div className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className={`${inputCls} pl-10`}
                placeholder={placeholder}
                value={(data as any)[key]}
                onChange={e => set(key as keyof WizardData, e.target.value)}
              />
            </div>
          </div>
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
  const [activeSection,  setActiveSection]  = useState(0)
  const [completed,      setCompleted]      = useState<Set<number>>(new Set())
  const [sectionError,   setSectionError]   = useState<string | null>(null)
  const [submitting,     setSubmitting]     = useState(false)

  const [categories,   setCategories]   = useState<Category[]>([])
  const [zones,        setZones]        = useState<Zone[]>([])
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([])
  const [amenities,    setAmenities]    = useState<Amenity[]>([])

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

  /* ── Catalogs ── */
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
    setSectionError(null)
  }, [])

  /* ── Validation ── */
  const validate = (idx: number): string | null => {
    if (idx === 0 && !data.business_name.trim()) return 'El nombre del negocio es obligatorio.'
    if (idx === 1 && data.category_ids.length === 0) return 'Selecciona al menos una categoría.'
    if (idx === 2 && data.business_hours.filter(h => h.open).length === 0) return 'Selecciona al menos un día de atención.'
    if (idx === 3 && !data.address.trim()) return 'La dirección es obligatoria.'
    if (idx === 3 && !data.zone_id) return 'Selecciona la zona de Bogotá.'
    if (idx === 4 && !data.description.trim()) return 'La descripción es obligatoria.'
    if (idx === 5 && !data.phone.trim() && !data.whatsapp.trim()) return 'Ingresa al menos un número de contacto.'
    return null
  }

  /* ── Section summary ── */
  const getSummary = (idx: number): string => {
    if (idx === 0) return data.business_name
    if (idx === 1) {
      const names = categories.filter(c => data.category_ids.includes(c.id)).map(c => c.name)
      return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ')
    }
    if (idx === 2) {
      const open = data.business_hours.filter(h => h.open)
      return `${open.length} día${open.length !== 1 ? 's' : ''} de atención`
    }
    if (idx === 3) return data.address.length > 50 ? data.address.slice(0, 50) + '...' : data.address
    if (idx === 4) return data.description.length > 50 ? data.description.slice(0, 50) + '...' : data.description
    if (idx === 5) return data.phone || data.whatsapp || data.website || data.instagram || ''
    return ''
  }

  const handleContinuar = (idx: number) => {
    const err = validate(idx)
    if (err) { setSectionError(err); return }
    setSectionError(null)
    setCompleted(prev => new Set([...prev, idx]))
    if (idx < SECTIONS.length - 1) setActiveSection(idx + 1)
  }

  const handleEdit = (idx: number) => {
    setCompleted(prev => { const s = new Set(prev); s.delete(idx); return s })
    setActiveSection(idx)
    setSectionError(null)
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    const err = validate(5)
    if (err) { setSectionError(err); return }
    setSubmitting(true); setSectionError(null)

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
    if (error) { setSectionError('Error al enviar. Por favor intenta de nuevo.'); console.error(error); return }
    navigate('/register/done')
  }

  /* ── Loading ── */
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthScreen />

  /* ── Existing status screens ── */
  if (existingStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
        <div className="bg-[#25B3CC] px-6 py-5">
          <div className="max-w-lg mx-auto">
            <h1 className="text-white text-xl font-bold">Tu solicitud</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <div className="w-16 h-16 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-gray-900 text-xl font-bold mb-3">Tu solicitud está en revisión</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Ya enviaste una solicitud. Nuestro equipo la está revisando y te contactaremos pronto.
            </p>
            <a href="/" className="text-[#25B3CC] hover:text-[#1E9DB5] text-sm font-medium transition-colors">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (existingStatus === 'approved') {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
        <div className="bg-[#25B3CC] px-6 py-5">
          <div className="max-w-lg mx-auto">
            <h1 className="text-white text-xl font-bold">Tu negocio en WAVI</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <div className="w-16 h-16 rounded-full bg-[#25B3CC]/15 border-2 border-[#25B3CC] flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-[#25B3CC]" />
            </div>
            <h2 className="text-gray-900 text-xl font-bold mb-3">¡Ya estás en WAVI!</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Tu negocio ya fue aprobado y está activo en la plataforma.
            </p>
            <a href="/" className="text-[#25B3CC] hover:text-[#1E9DB5] text-sm font-medium transition-colors">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }

  /* ── Progress ── */
  const progressPct   = Math.round((completed.size / SECTIONS.length) * 100)
  const allCompleted  = completed.size === SECTIONS.length

  /* ── Section content map ── */
  const sectionContent: Record<number, React.ReactNode> = {
    0: <SectionNombre      data={data} set={set} />,
    1: <SectionCategorias  data={data} set={set} categories={categories} cuisineTypes={cuisineTypes} />,
    2: <SectionHorario     data={data} set={set} />,
    3: <SectionUbicacion   data={data} set={set} zones={zones} />,
    4: <SectionDescripcion data={data} set={set} amenities={amenities} />,
    5: <SectionContactos   data={data} set={set} />,
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">

      {/* ── Teal header ── */}
      <div className="bg-[#25B3CC] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Información del negocio</p>
                <p className="text-white/75 text-xs">
                  {completed.size} de {SECTIONS.length} · {progressPct}%
                </p>
              </div>
            </div>
            <div className="text-white/80 text-xs font-medium">
              {completed.size}/{SECTIONS.length}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Step dots ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[65px] z-10">
        <div className="max-w-2xl mx-auto px-5 py-3">
          <div className="flex items-center gap-0">
            {SECTIONS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    completed.has(i)
                      ? 'bg-green-500 border-green-500 text-white'
                      : i === activeSection
                      ? 'bg-[#25B3CC] border-[#25B3CC] text-white'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {completed.has(i) ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide hidden sm:block ${
                    i === activeSection ? 'text-[#25B3CC]'
                    : completed.has(i) ? 'text-green-500'
                    : 'text-gray-300'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < SECTIONS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 transition-all duration-500 ${completed.has(i) ? 'bg-green-300' : 'bg-gray-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-3 pb-12">
        <div className="mb-5">
          <h1 className="text-gray-900 text-xl font-bold">Cuéntanos sobre tu establecimiento</h1>
          <p className="text-gray-500 text-sm mt-1">Completa cada sección. Se marcan en verde a medida que avanzas.</p>
        </div>

        {SECTIONS.map((s, i) => (
          <AccordionSection
            key={s.id}
            index={i}
            title={s.title}
            summary={getSummary(i)}
            isActive={activeSection === i && !completed.has(i)}
            isCompleted={completed.has(i)}
            isLocked={i > activeSection && !completed.has(i)}
            onEdit={() => handleEdit(i)}
            error={activeSection === i ? sectionError : null}
          >
            {sectionContent[i]}

            {/* Action button */}
            {i < SECTIONS.length - 1 ? (
              <ContinuarBtn onClick={() => handleContinuar(i)} />
            ) : (
              <div className="mt-5 space-y-4">
                <div className="bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#25B3CC] shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Al enviar, tu solicitud queda en revisión. Te confirmaremos en máximo{' '}
                    <span className="text-gray-900 font-semibold">48 horas hábiles</span>.
                  </p>
                </div>
                {allCompleted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-70"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : <><Sparkles className="w-4 h-4" /> Enviar solicitud</>}
                  </button>
                ) : (
                  <ContinuarBtn onClick={() => handleContinuar(i)} label="Guardar contactos" />
                )}
              </div>
            )}
          </AccordionSection>
        ))}
      </div>
    </div>
  )
}
