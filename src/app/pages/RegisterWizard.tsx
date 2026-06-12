import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import {
  ChevronDown, ChevronUp, Check, AlertCircle, Loader2,
  MapPin, Phone, Globe, Instagram, MessageCircle, Clock,
  CheckCircle2, Sparkles, ArrowLeft, ChevronRight, Upload, ImageIcon,
  X, Wrench, CalendarDays, Tag, Info,
  Heart, Coffee, Users, Pencil, Trash2, Plus,
} from 'lucide-react'

declare const google: any

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface Category    { id: number; name: string }
interface Zone        { id: number; name: string }
interface CuisineType { id: number; name: string }
interface Amenity     { id: number; name: string; description: string }
interface HourEntry   { weekday: number; open: boolean; start_time: string; end_time: string }

interface ServiceEntry {
  id:          string
  name:        string
  price:       string
  duration:    string
  charge_type: 'gratis' | 'con_consumo' | 'por_persona' | 'por_servicio'
  capacity:    string
  description: string
  image_urls:  string[]
}

interface EventEntry {
  id:           string
  titulo:       string
  fecha_inicio: string  // YYYY-MM-DD
  fecha_fin:    string  // YYYY-MM-DD
  duracion:     string
  hora:         string  // ej. "9:00 PM"
  precio:       string
  descripcion:  string
  image_urls:   string[]
}

interface PromoEntry {
  id:          string
  titulo:      string
  descripcion: string
  image_url:   string  // flyer, puede ser ''
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
  image_urls:       string[]
  logo_url:         string
  services:         ServiceEntry[]
  events:           EventEntry[]
  promos:           PromoEntry[]
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
  image_urls: [], logo_url: '', services: [], events: [], promos: [],
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
  { label: 'CONTACTO',  title: 'Contacto para reservas' },
  { label: 'IMÁGENES',  title: 'Imágenes' },
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
  const [mapsReady,  setMapsReady]  = useState(false)
  const [mapsError,  setMapsError]  = useState(false)
  const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_KEY

  useEffect(() => {
    if (!hasKey) return
    // Global auth failure callback — called by Google when key is invalid
    ;(window as any).gm_authFailure = () => setMapsError(true)

    if ((window as any).google?.maps) { setMapsReady(true); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) {
      existing.addEventListener('load', () => setMapsReady(true))
      existing.addEventListener('error', () => setMapsError(true))
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`
    script.async = true
    script.onload  = () => setMapsReady(true)
    script.onerror = () => setMapsError(true)
    document.head.appendChild(script)
    return () => { delete (window as any).gm_authFailure }
  }, [hasKey])

  useEffect(() => {
    if (!mapsReady || mapsError || !mapRef.current || mapInstanceRef.current) return
    const center = { lat: data.location_lat ?? 4.711, lng: data.location_lng ?? -74.0721 }
    const map = new google.maps.Map(mapRef.current, { center, zoom: data.location_lat ? 16 : 12, disableDefaultUI: true, zoomControl: true })
    const marker = new google.maps.Marker({ position: center, map, draggable: true, visible: !!data.location_lat })
    marker.addListener('dragend', (e: any) => { set('location_lat', e.latLng.lat()); set('location_lng', e.latLng.lng()) })
    mapInstanceRef.current = map; markerRef.current = marker
  }, [mapsReady, mapsError])

  useEffect(() => {
    if (!mapsReady || mapsError || !addressRef.current) return
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
  }, [mapsReady, mapsError])

  const showMap = hasKey && !mapsError

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Dirección <span className="text-[#25B3CC]">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input ref={addressRef} className={`${inputCls} pl-10`}
            placeholder="Ingresa la dirección completa de tu negocio"
            value={data.address} onChange={e => set('address', e.target.value)} />
        </div>
        {mapsError && (
          <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            El autocompletado no está disponible. Puedes escribir la dirección manualmente.
          </p>
        )}
      </div>

      {/* Map — hidden when error to avoid Google's error overlay */}
      <div
        ref={mapRef}
        className={`w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center ${!showMap ? 'hidden' : ''}`}
      />
      {!hasKey && (
        <div className="w-full h-44 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" /> Mapa no disponible
          </div>
        </div>
      )}

      {data.location_lat && !mapsError && (
        <p className="text-gray-500 text-xs flex items-center gap-1.5">
          <Check className="w-3 h-3 text-[#25B3CC]" /> Puedes arrastrar el pin para afinar la posición.
        </p>
      )}

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

/* ─── Step 4 — Contacto para reservas ───────────────────────────────────────── */
function Step4({ data, set }: {
  data: WizardData; set: (k: keyof WizardData, v: any) => void
}) {
  const [selected, setSelected] = useState<'whatsapp' | 'website' | null>(
    data.whatsapp ? 'whatsapp' : data.website ? 'website' : null
  )

  const selectMethod = (method: 'whatsapp' | 'website') => {
    setSelected(method)
    if (method === 'whatsapp') set('website', '')
    if (method === 'website')  set('whatsapp', '')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-[#25B3CC] shrink-0 mt-0.5" />
        <p className="text-gray-600 text-sm leading-relaxed">
          Para mayor facilidad de tus clientes, elige <span className="font-semibold text-gray-800">solo un medio de contacto</span> para recibir reservas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* WhatsApp */}
        <button type="button" onClick={() => selectMethod('whatsapp')}
          className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
            selected === 'whatsapp'
              ? 'border-[#25B3CC] bg-[#25B3CC]/8'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}>
          <MessageCircle className={`w-6 h-6 ${selected === 'whatsapp' ? 'text-[#25B3CC]' : 'text-gray-400'}`} />
          <span className={`text-sm font-semibold ${selected === 'whatsapp' ? 'text-[#25B3CC]' : 'text-gray-500'}`}>WhatsApp</span>
          {selected === 'whatsapp' && <Check className="w-4 h-4 text-[#25B3CC]" />}
        </button>

        {/* Sitio web */}
        <button type="button" onClick={() => selectMethod('website')}
          className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
            selected === 'website'
              ? 'border-[#25B3CC] bg-[#25B3CC]/8'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}>
          <Globe className={`w-6 h-6 ${selected === 'website' ? 'text-[#25B3CC]' : 'text-gray-400'}`} />
          <span className={`text-sm font-semibold ${selected === 'website' ? 'text-[#25B3CC]' : 'text-gray-500'}`}>Sitio web</span>
          {selected === 'website' && <Check className="w-4 h-4 text-[#25B3CC]" />}
        </button>
      </div>

      {selected === 'whatsapp' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Número de WhatsApp <span className="text-[#25B3CC]">*</span>
          </label>
          <div className="relative">
            <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className={`${inputCls} pl-10`} placeholder="+57 310 000 0000"
              value={data.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
          </div>
        </div>
      )}

      {selected === 'website' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            URL del sitio web <span className="text-[#25B3CC]">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className={`${inputCls} pl-10`} placeholder="www.tunegocio.com"
              value={data.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
      )}

      {!selected && (
        <p className="text-gray-400 text-xs text-center pt-1">Selecciona una opción para continuar.</p>
      )}
    </div>
  )
}

/* ─── Step 5 — Imágenes ──────────────────────────────────────────────────────── */
const MAX_IMAGES = 6

function Step5({ data, set, session }: { data: WizardData; set: (k: keyof WizardData, v: any) => void; session: any }) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [error,        setError]        = useState<string | null>(null)

  const urls   = data.image_urls
  const canAdd = urls.length < MAX_IMAGES

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingIdx(slotIdx); setError(null)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${session.user.id}/gallery-${slotIdx}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('business-registrations')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('business-registrations').getPublicUrl(path)
      const newUrls = [...urls]
      newUrls[slotIdx] = urlData.publicUrl
      set('image_urls', newUrls)
    } catch (err: any) {
      console.error('upload error (gallery):', err)
      setError(err?.message ?? 'Error al subir la imagen.')
    }
    setUploadingIdx(null)
  }

  const removeImage = (idx: number) => {
    set('image_urls', urls.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-[#25B3CC] shrink-0 mt-0.5" />
        <p className="text-gray-600 text-sm leading-relaxed">
          Solo es obligatoria la primera imagen. Puedes subir hasta {MAX_IMAGES} fotos —{' '}
          <span className="font-medium text-gray-800">también podrás agregar o editar imágenes más adelante.</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Slots con imagen */}
        {urls.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
            <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
            {/* Badge principal */}
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-[#25B3CC] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                PRINCIPAL
              </span>
            )}
            {/* Reemplazar + eliminar */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Upload className="w-3 h-3" /> Cambiar
                <input type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={e => handleFile(e, idx)} className="hidden" />
              </label>
              <button type="button" onClick={() => removeImage(idx)}
                className="bg-red-500/80 hover:bg-red-500 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors">
                Eliminar
              </button>
            </div>
            {uploadingIdx === idx && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" />
              </div>
            )}
          </div>
        ))}

        {/* Slot para agregar */}
        {canAdd && (
          <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
            urls.length === 0
              ? 'border-[#25B3CC]/50 bg-[#25B3CC]/5 hover:border-[#25B3CC]'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
          }`}>
            {uploadingIdx === urls.length ? (
              <Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" />
            ) : (
              <>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${urls.length === 0 ? 'bg-[#25B3CC]/15' : 'bg-gray-100'}`}>
                  <span className={`text-xl font-light leading-none ${urls.length === 0 ? 'text-[#25B3CC]' : 'text-gray-400'}`}>+</span>
                </div>
                <span className={`text-[10px] font-medium ${urls.length === 0 ? 'text-[#25B3CC]' : 'text-gray-400'}`}>
                  {urls.length === 0 ? 'Agregar imagen' : 'Agregar'}
                </span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp"
              onChange={e => handleFile(e, urls.length)} className="hidden" />
          </label>
        )}
      </div>

      <p className="text-gray-400 text-[11px]">
        {urls.length}/{MAX_IMAGES} imágenes · JPG, PNG o WebP · Máx. 5MB por foto
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
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

/* ─── Review Screen ──────────────────────────────────────────────────────────── */
const PROMO_CARD = { label: 'Promociones', Icon: Tag, from: '#6B4500', to: '#D4920A' }

const BLANK_EVENT = (): EventEntry => ({
  id: Date.now().toString(), titulo: '', fecha_inicio: '', fecha_fin: '',
  duracion: '2 horas', hora: '8:00 PM', precio: '', descripcion: '', image_urls: [],
})

const CHARGE_TYPES = [
  { value: 'gratis'      as const, label: 'Gratis',       sub: 'Sin costo',         Icon: Heart  },
  { value: 'con_consumo' as const, label: 'Con consumo',  sub: 'Mínimo de consumo', Icon: Coffee },
  { value: 'por_persona' as const, label: 'Por persona',  sub: 'Cobro individual',  Icon: Users  },
  { value: 'por_servicio'as const, label: 'Por servicio', sub: 'Tarifa única',       Icon: Tag    },
]

const CHARGE_LABEL: Record<ServiceEntry['charge_type'], string> = {
  gratis: 'Gratis', con_consumo: 'Con consumo',
  por_persona: 'Por persona', por_servicio: 'Por servicio',
}

const DURATION_OPTIONS = ['30 minutos', '1 hora', '1.5 horas', '2 horas', '3 horas', 'Más de 3 horas']

const BLANK_SERVICE = (): ServiceEntry => ({
  id: Date.now().toString(), name: '', price: '', duration: '1 hora',
  charge_type: 'por_persona', capacity: '', description: '', image_urls: [],
})

function ReviewScreen({
  getSummary, onEdit, onBack, onSubmit,
  submitting, error, bannerDismissed, onDismissBanner, session,
  services, onServicesChange,
  events, onEventsChange,
  promos, onPromosChange,
}: {
  getSummary:       (idx: number) => string
  onEdit:           (idx: number) => void
  onBack:           () => void
  onSubmit:         () => void
  submitting:       boolean
  error:            string | null
  bannerDismissed:  boolean
  onDismissBanner:  () => void
  session:          any
  services:         ServiceEntry[]
  onServicesChange: (s: ServiceEntry[]) => void
  events:           EventEntry[]
  onEventsChange:   (e: EventEntry[]) => void
  promos:           PromoEntry[]
  onPromosChange:   (p: PromoEntry[]) => void
}) {
  /* ── Services state ── */
  const [servicesOpen,  setServicesOpen]  = useState(false)
  const [draft,         setDraft]         = useState<ServiceEntry | null>(null)
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [serviceError,  setServiceError]  = useState<string | null>(null)

  const setDraftField = (k: keyof ServiceEntry, v: any) => {
    setDraft(prev => prev ? { ...prev, [k]: v } : prev)
    setServiceError(null)
  }
  const openAdd = () => { setEditingId(null); setDraft(BLANK_SERVICE()); setServiceError(null) }
  const openEdit = (svc: ServiceEntry) => { setEditingId(svc.id); setDraft({ ...svc }); setServiceError(null) }
  const cancelForm = () => { setDraft(null); setEditingId(null); setServiceError(null) }
  const saveService = () => {
    if (!draft) return
    if (!draft.name.trim()) { setServiceError('El nombre del servicio es obligatorio.'); return }
    if (editingId) onServicesChange(services.map(s => s.id === editingId ? draft : s))
    else onServicesChange([...services, draft])
    setDraft(null); setEditingId(null); setServiceError(null)
  }
  const deleteService = (id: string) => onServicesChange(services.filter(s => s.id !== id))

  const handleUploadImage = async (file: File, slot: number) => {
    if (!draft) return
    setUploadingSlot(slot); setServiceError(null)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${session.user.id}/svc-${Date.now()}-${slot}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('business-registrations').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: ud } = supabase.storage.from('business-registrations').getPublicUrl(path)
      setDraft(prev => {
        if (!prev) return prev
        const urls = [...prev.image_urls]; urls[slot] = ud.publicUrl
        return { ...prev, image_urls: urls }
      })
    } catch (err: any) { setServiceError(err?.message ?? 'Error al subir la imagen.') }
    setUploadingSlot(null)
  }
  const removeImage = (slot: number) => {
    setDraft(prev => prev ? { ...prev, image_urls: prev.image_urls.filter((_, i) => i !== slot) } : prev)
  }

  /* ── Events state ── */
  const [eventsOpen,      setEventsOpen]      = useState(false)
  const [draftEvt,        setDraftEvt]        = useState<EventEntry | null>(null)
  const [editingEvtId,    setEditingEvtId]    = useState<string | null>(null)
  const [uploadingEvtSlot,setUploadingEvtSlot]= useState<number | null>(null)
  const [eventError,      setEventError]      = useState<string | null>(null)

  const setEvtField = (k: keyof EventEntry, v: any) => {
    setDraftEvt(prev => prev ? { ...prev, [k]: v } : prev)
    setEventError(null)
  }
  const openAddEvt = () => { setEditingEvtId(null); setDraftEvt(BLANK_EVENT()); setEventError(null) }
  const openEditEvt = (evt: EventEntry) => { setEditingEvtId(evt.id); setDraftEvt({ ...evt }); setEventError(null) }
  const cancelEvtForm = () => { setDraftEvt(null); setEditingEvtId(null); setEventError(null) }
  const saveEvent = () => {
    if (!draftEvt) return
    if (!draftEvt.titulo.trim()) { setEventError('El título del evento es obligatorio.'); return }
    if (!draftEvt.fecha_inicio)  { setEventError('La fecha de inicio es obligatoria.'); return }
    if (editingEvtId) onEventsChange(events.map(e => e.id === editingEvtId ? draftEvt : e))
    else onEventsChange([...events, draftEvt])
    setDraftEvt(null); setEditingEvtId(null); setEventError(null)
  }
  const deleteEvent = (id: string) => onEventsChange(events.filter(e => e.id !== id))

  const handleUploadEvtImage = async (file: File, slot: number) => {
    if (!draftEvt) return
    setUploadingEvtSlot(slot); setEventError(null)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${session.user.id}/evt-${Date.now()}-${slot}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('business-registrations').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: ud } = supabase.storage.from('business-registrations').getPublicUrl(path)
      setDraftEvt(prev => {
        if (!prev) return prev
        const urls = [...prev.image_urls]; urls[slot] = ud.publicUrl
        return { ...prev, image_urls: urls }
      })
    } catch (err: any) { setEventError(err?.message ?? 'Error al subir la imagen.') }
    setUploadingEvtSlot(null)
  }
  const removeEvtImage = (slot: number) => {
    setDraftEvt(prev => prev ? { ...prev, image_urls: prev.image_urls.filter((_, i) => i !== slot) } : prev)
  }

  const fmtDate = (d: string) => {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  /* ── Promos state ── */
  const [promosOpen,     setPromosOpen]     = useState(false)
  const [draftPromo,     setDraftPromo]     = useState<PromoEntry | null>(null)
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)
  const [uploadingPromo, setUploadingPromo] = useState(false)
  const [promoError,     setPromoError]     = useState<string | null>(null)

  const BLANK_PROMO = (): PromoEntry => ({ id: Date.now().toString(), titulo: '', descripcion: '', image_url: '' })
  const setPromoField   = (k: keyof PromoEntry, v: any) => { setDraftPromo(p => p ? { ...p, [k]: v } : p); setPromoError(null) }
  const openAddPromo    = () => { setEditingPromoId(null); setDraftPromo(BLANK_PROMO()); setPromoError(null) }
  const openEditPromo   = (p: PromoEntry) => { setEditingPromoId(p.id); setDraftPromo({ ...p }); setPromoError(null) }
  const cancelPromoForm = () => { setDraftPromo(null); setEditingPromoId(null); setPromoError(null) }
  const savePromo = () => {
    if (!draftPromo?.titulo.trim()) { setPromoError('El título es obligatorio.'); return }
    if (editingPromoId) onPromosChange(promos.map(p => p.id === editingPromoId ? draftPromo : p))
    else onPromosChange([...promos, draftPromo])
    cancelPromoForm()
  }
  const deletePromo = (id: string) => onPromosChange(promos.filter(p => p.id !== id))

  const handleUploadPromoFlyer = async (file: File) => {
    setUploadingPromo(true); setPromoError(null)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${session.user.id}/promo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('business-registrations').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: ud } = supabase.storage.from('business-registrations').getPublicUrl(path)
      setDraftPromo(p => p ? { ...p, image_url: ud.publicUrl } : p)
    } catch (err: any) { setPromoError(err?.message ?? 'Error al subir el flyer.') }
    setUploadingPromo(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">

      {/* ── Header ── */}
      <div className="bg-[#25B3CC] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Revisa tu información</p>
              <p className="text-white/75 text-xs">Paso final antes de enviar</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase">{session?.user?.email?.[0] ?? '?'}</span>
          </div>
        </div>
        <div className="h-1 bg-white" />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5 pb-16">

        {/* Summary sections */}
        <div className="space-y-2">
          <h2 className="text-gray-900 font-bold text-base px-1">Tu negocio</h2>
          {SECTIONS.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{idx + 1} · {section.label}</p>
                <p className="text-gray-800 text-sm font-medium mt-0.5 truncate">{getSummary(idx)}</p>
              </div>
              <button onClick={() => onEdit(idx)}
                className="text-[#25B3CC] text-xs font-semibold flex-shrink-0 hover:text-[#1E9DB5] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#25B3CC]/8">
                Editar
              </button>
            </div>
          ))}
        </div>

        {/* Tip banner */}
        {!bannerDismissed && (
          <div className="bg-[#EBF8FB] border border-[#25B3CC]/30 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#25B3CC] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[#125F6D] font-bold text-sm">Agrega la información</p>
              <p className="text-[#25B3CC] text-sm mt-0.5 leading-relaxed">
                ¡Perfiles completos atraen más clientes! Asegúrate de que los usuarios vean lo mejor de tu negocio.
              </p>
            </div>
            <button onClick={onDismissBanner} className="text-[#25B3CC]/60 hover:text-[#25B3CC] transition-colors flex-shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Optional sections */}
        <div className="space-y-3">
          <div>
            <h2 className="text-gray-900 font-bold text-base">Potencia tu perfil</h2>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
              Las siguientes secciones son opcionales, pero agregar esta información aumenta
              significativamente la probabilidad de que los usuarios completen una reserva en tu negocio.
            </p>
          </div>

          {/* ── Servicios — card or expanded panel ── */}
          {servicesOpen ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-[#25B3CC]" />
                  <span className="font-bold text-gray-900 text-sm">Servicios</span>
                  {services.length > 0 && (
                    <span className="text-xs font-semibold text-[#25B3CC] bg-[#25B3CC]/10 px-2 py-0.5 rounded-full">
                      {services.length} agregado{services.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button onClick={() => { setServicesOpen(false); cancelForm() }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {draft ? (
                /* ── Service form ── */
                <div className="px-5 py-5 space-y-5">
                  <p className="font-semibold text-gray-900 text-sm">{editingId ? 'Editar servicio' : 'Nuevo servicio'}</p>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Nombre del servicio <span className="text-[#25B3CC]">*</span>
                    </label>
                    <input className={inputCls} placeholder="Ej. Karaoke privado"
                      value={draft.name} onChange={e => setDraftField('name', e.target.value)} maxLength={80} />
                  </div>

                  {/* Charge type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Tipo de cobro
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CHARGE_TYPES.map(ct => (
                        <button key={ct.value} type="button" onClick={() => setDraftField('charge_type', ct.value)}
                          className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 transition-all text-left ${
                            draft.charge_type === ct.value
                              ? 'border-[#25B3CC] bg-[#25B3CC]/8'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            draft.charge_type === ct.value ? 'bg-[#25B3CC] text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <ct.Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-bold leading-tight ${draft.charge_type === ct.value ? 'text-[#25B3CC]' : 'text-gray-800'}`}>
                              {ct.label}
                            </p>
                            <p className="text-gray-400 text-xs">{ct.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price (hidden for gratis) */}
                  {draft.charge_type !== 'gratis' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        {draft.charge_type === 'con_consumo' ? 'Consumo mínimo (COP)' : 'Precio (COP)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input className={`${inputCls} pl-7`} type="number" placeholder="Ej. 45000"
                          value={draft.price} onChange={e => setDraftField('price', e.target.value)} min="0" />
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Duración
                    </label>
                    <div className="relative">
                      <select className={selectCls} value={draft.duration}
                        onChange={e => setDraftField('duration', e.target.value)}>
                        {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Capacidad (personas)
                    </label>
                    <input className={inputCls} type="number" placeholder="Ej. 10"
                      value={draft.capacity} onChange={e => setDraftField('capacity', e.target.value)} min="1" />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Descripción
                    </label>
                    <textarea className={`${inputCls} resize-none`} rows={3}
                      placeholder="Describe el servicio que ofreces..."
                      value={draft.description} onChange={e => setDraftField('description', e.target.value)} maxLength={300} />
                    <div className="text-right text-gray-400 text-[11px] mt-1">{draft.description.length}/300</div>
                  </div>

                  {/* Images — max 3 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Imágenes <span className="normal-case font-normal text-gray-400">(máx. 3)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map(slot => {
                        const url = draft.image_urls[slot]
                        return url ? (
                          <div key={slot} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={() => removeImage(slot)}
                                className="bg-red-500/90 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg">
                                Eliminar
                              </button>
                            </div>
                            {uploadingSlot === slot && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <label key={slot}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#25B3CC]/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-gray-50 hover:bg-[#25B3CC]/5">
                            {uploadingSlot === slot
                              ? <Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" />
                              : <><Upload className="w-4 h-4 text-gray-400" /><span className="text-[10px] text-gray-400">Agregar</span></>
                            }
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, slot); e.target.value = '' }} />
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {serviceError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-sm">{serviceError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={saveService}
                      className="flex-1 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold py-3 rounded-xl text-sm transition-all">
                      {editingId ? 'Guardar cambios' : 'Guardar servicio'}
                    </button>
                    <button onClick={cancelForm}
                      className="px-5 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Services list ── */
                <div className="px-5 py-4 space-y-3">
                  {services.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Aún no has agregado servicios.</p>
                  )}
                  {services.map(svc => (
                    <div key={svc.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      {svc.image_urls[0] ? (
                        <img src={svc.image_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#25B3CC]/10 flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-5 h-5 text-[#25B3CC]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {CHARGE_LABEL[svc.charge_type]}
                          {svc.price && svc.charge_type !== 'gratis' ? ` · $${Number(svc.price).toLocaleString('es-CO')}` : ''}
                          {svc.duration ? ` · ${svc.duration}` : ''}
                        </p>
                        {svc.capacity && <p className="text-gray-400 text-xs mt-0.5">Cap: {svc.capacity} personas</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(svc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#25B3CC] hover:bg-[#25B3CC]/8 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteService(svc.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={openAdd}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#25B3CC]/40 hover:border-[#25B3CC] text-[#25B3CC] font-semibold py-3 rounded-xl text-sm transition-all hover:bg-[#25B3CC]/5">
                    <Plus className="w-4 h-4" /> Agregar servicio
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Servicios card ── */
            <button type="button" onClick={() => setServicesOpen(true)}
              className="w-full relative overflow-hidden rounded-2xl h-24 flex items-end p-4 text-left">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #125F6D, #25B3CC)' }} />
              <div className="absolute inset-0 flex items-center justify-end pr-6 opacity-20">
                <Wrench className="w-20 h-20 text-white" />
              </div>
              <span className="relative text-white font-bold text-lg drop-shadow">Servicios</span>
              {services.length > 0 ? (
                <div className="absolute bottom-3 right-3 bg-green-500 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-semibold">{services.length}</span>
                </div>
              ) : (
                <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-gray-700 text-xs font-semibold">0/1</span>
                </div>
              )}
            </button>
          )}

          {/* ── Eventos — card or expanded panel ── */}
          {eventsOpen ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-[#7C5CBF]" />
                  <span className="font-bold text-gray-900 text-sm">Eventos</span>
                  {events.length > 0 && (
                    <span className="text-xs font-semibold text-[#7C5CBF] bg-[#7C5CBF]/10 px-2 py-0.5 rounded-full">
                      {events.length} agregado{events.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button onClick={() => { setEventsOpen(false); cancelEvtForm() }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {draftEvt ? (
                /* ── Event form ── */
                <div className="px-5 py-5 space-y-5">
                  <p className="font-semibold text-gray-900 text-sm">{editingEvtId ? 'Editar evento' : 'Nuevo evento'}</p>

                  {/* Título */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Título del evento <span className="text-[#25B3CC]">*</span>
                    </label>
                    <input className={inputCls} placeholder="Ej. Noche de karaoke"
                      value={draftEvt.titulo} onChange={e => setEvtField('titulo', e.target.value)} maxLength={100} />
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Fecha inicio <span className="text-[#25B3CC]">*</span>
                      </label>
                      <input className={inputCls} type="date"
                        value={draftEvt.fecha_inicio} onChange={e => setEvtField('fecha_inicio', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Fecha fin
                      </label>
                      <input className={inputCls} type="date"
                        min={draftEvt.fecha_inicio || undefined}
                        value={draftEvt.fecha_fin} onChange={e => setEvtField('fecha_fin', e.target.value)} />
                    </div>
                  </div>

                  {/* Hora y Duración */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Hora de inicio
                      </label>
                      <div className="relative">
                        <select className={selectCls} value={draftEvt.hora}
                          onChange={e => setEvtField('hora', e.target.value)}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Duración
                      </label>
                      <div className="relative">
                        <select className={selectCls} value={draftEvt.duracion}
                          onChange={e => setEvtField('duracion', e.target.value)}>
                          {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Precio del boleto (COP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input className={`${inputCls} pl-7`} type="number" placeholder="0 = Gratis"
                        value={draftEvt.precio} onChange={e => setEvtField('precio', e.target.value)} min="0" />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Descripción
                    </label>
                    <textarea className={`${inputCls} resize-none`} rows={3}
                      placeholder="Describe el evento..."
                      value={draftEvt.descripcion} onChange={e => setEvtField('descripcion', e.target.value)} maxLength={300} />
                    <div className="text-right text-gray-400 text-[11px] mt-1">{draftEvt.descripcion.length}/300</div>
                  </div>

                  {/* Imágenes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Imágenes <span className="normal-case font-normal text-gray-400">(máx. 3)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map(slot => {
                        const url = draftEvt.image_urls[slot]
                        return url ? (
                          <div key={slot} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={() => removeEvtImage(slot)}
                                className="bg-red-500/90 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg">
                                Eliminar
                              </button>
                            </div>
                            {uploadingEvtSlot === slot && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <label key={slot}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#7C5CBF]/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all bg-gray-50 hover:bg-[#7C5CBF]/5">
                            {uploadingEvtSlot === slot
                              ? <Loader2 className="w-5 h-5 text-[#7C5CBF] animate-spin" />
                              : <><Upload className="w-4 h-4 text-gray-400" /><span className="text-[10px] text-gray-400">Agregar</span></>
                            }
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadEvtImage(f, slot); e.target.value = '' }} />
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Nota de ubicación */}
                  <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-gray-500 text-xs leading-relaxed">
                      El lugar del evento será la dirección de tu establecimiento. Por temas de seguridad, actualmente solo se permiten eventos en este lugar.
                    </p>
                  </div>

                  {eventError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-sm">{eventError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={saveEvent}
                      className="flex-1 bg-[#7C5CBF] hover:bg-[#6A4DAD] text-white font-semibold py-3 rounded-xl text-sm transition-all">
                      {editingEvtId ? 'Guardar cambios' : 'Guardar evento'}
                    </button>
                    <button onClick={cancelEvtForm}
                      className="px-5 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Events list ── */
                <div className="px-5 py-4 space-y-3">
                  {events.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Aún no has agregado eventos.</p>
                  )}
                  {events.map(evt => (
                    <div key={evt.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      {evt.image_urls[0] ? (
                        <img src={evt.image_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#7C5CBF]/10 flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-5 h-5 text-[#7C5CBF]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{evt.titulo}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {fmtDate(evt.fecha_inicio)}{evt.fecha_fin && evt.fecha_fin !== evt.fecha_inicio ? ` → ${fmtDate(evt.fecha_fin)}` : ''}
                          {evt.hora ? ` · ${evt.hora}` : ''}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {evt.precio && Number(evt.precio) > 0 ? `$${Number(evt.precio).toLocaleString('es-CO')}` : 'Gratis'}
                          {evt.duracion ? ` · ${evt.duracion}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEditEvt(evt)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C5CBF] hover:bg-[#7C5CBF]/8 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteEvent(evt.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={openAddEvt}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#7C5CBF]/40 hover:border-[#7C5CBF] text-[#7C5CBF] font-semibold py-3 rounded-xl text-sm transition-all hover:bg-[#7C5CBF]/5">
                    <Plus className="w-4 h-4" /> Agregar evento
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Eventos card ── */
            <button type="button" onClick={() => setEventsOpen(true)}
              className="w-full relative overflow-hidden rounded-2xl h-24 flex items-end p-4 text-left">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #3B2A6E, #7C5CBF)' }} />
              <div className="absolute inset-0 flex items-center justify-end pr-6 opacity-20">
                <CalendarDays className="w-20 h-20 text-white" />
              </div>
              <span className="relative text-white font-bold text-lg drop-shadow">Eventos</span>
              {events.length > 0 ? (
                <div className="absolute bottom-3 right-3 bg-green-500 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-semibold">{events.length}</span>
                </div>
              ) : (
                <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-gray-700 text-xs font-semibold">0/1</span>
                </div>
              )}
            </button>
          )}

          {/* ── Promociones — card or expanded panel ── */}
          {promosOpen ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-[#D4920A]" />
                  <span className="font-bold text-gray-900 text-sm">Promociones</span>
                  {promos.length > 0 && (
                    <span className="text-xs font-semibold text-[#D4920A] bg-[#D4920A]/10 px-2 py-0.5 rounded-full">
                      {promos.length} agregada{promos.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button onClick={() => { setPromosOpen(false); cancelPromoForm() }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {draftPromo ? (
                /* ── Promo form ── */
                <div className="px-5 py-5 space-y-5">
                  <p className="font-semibold text-gray-900 text-sm">{editingPromoId ? 'Editar promoción' : 'Nueva promoción'}</p>

                  {/* Título */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Título <span className="text-[#25B3CC]">*</span>
                    </label>
                    <input className={inputCls} placeholder="Ej. 2x1 en tragos · Happy Hour · Brunch de fin de semana"
                      value={draftPromo.titulo} onChange={e => setPromoField('titulo', e.target.value)} maxLength={80} />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Descripción
                    </label>
                    <textarea className={`${inputCls} resize-none`} rows={3}
                      placeholder="Describe los detalles de la promoción..."
                      value={draftPromo.descripcion} onChange={e => setPromoField('descripcion', e.target.value)} maxLength={300} />
                    <div className="text-right text-gray-400 text-[11px] mt-1">{draftPromo.descripcion.length}/300</div>
                  </div>

                  {/* Imagen / Flyer */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Imagen / Flyer <span className="normal-case font-normal text-gray-400">(opcional)</span>
                    </label>
                    {draftPromo.image_url ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={draftPromo.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => setPromoField('image_url', '')}
                            className="bg-red-500/90 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg">
                            Eliminar
                          </button>
                        </div>
                        {uploadingPromo && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#D4920A] animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-dashed border-gray-200 hover:border-[#D4920A]/50 px-4 py-4 transition-all bg-gray-50 hover:bg-[#D4920A]/5">
                        {uploadingPromo
                          ? <Loader2 className="w-5 h-5 text-[#D4920A] animate-spin flex-shrink-0" />
                          : <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        }
                        <div>
                          <p className="text-gray-600 text-sm font-medium">Subir imagen / flyer</p>
                          <p className="text-gray-400 text-xs">JPG, PNG o WebP</p>
                        </div>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPromoFlyer(f); e.target.value = '' }} />
                      </label>
                    )}
                  </div>

                  {promoError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-sm">{promoError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={savePromo}
                      className="flex-1 bg-[#D4920A] hover:bg-[#B87A08] text-white font-semibold py-3 rounded-xl text-sm transition-all">
                      {editingPromoId ? 'Guardar cambios' : 'Guardar promoción'}
                    </button>
                    <button onClick={cancelPromoForm}
                      className="px-5 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Promos list ── */
                <div className="px-5 py-4 space-y-3">
                  {promos.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Aún no has agregado promociones.</p>
                  )}
                  {promos.map(promo => (
                    <div key={promo.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      {promo.image_url ? (
                        <img src={promo.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#D4920A]/10 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-[#D4920A]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{promo.titulo}</p>
                        {promo.descripcion && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{promo.descripcion}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEditPromo(promo)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#D4920A] hover:bg-[#D4920A]/8 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deletePromo(promo.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={openAddPromo}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#D4920A]/40 hover:border-[#D4920A] text-[#D4920A] font-semibold py-3 rounded-xl text-sm transition-all hover:bg-[#D4920A]/5">
                    <Plus className="w-4 h-4" /> Agregar promoción
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Promociones card ── */
            <button type="button" onClick={() => setPromosOpen(true)}
              className="w-full relative overflow-hidden rounded-2xl h-24 flex items-end p-4 text-left">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${PROMO_CARD.from}, ${PROMO_CARD.to})` }} />
              <div className="absolute inset-0 flex items-center justify-end pr-6 opacity-20">
                <PROMO_CARD.Icon className="w-20 h-20 text-white" />
              </div>
              <span className="relative text-white font-bold text-lg drop-shadow">{PROMO_CARD.label}</span>
              {promos.length > 0 ? (
                <div className="absolute bottom-3 right-3 bg-green-500 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-semibold">{promos.length}</span>
                </div>
              ) : (
                <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-gray-700 text-xs font-semibold">0/1</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Submit */}
        <div className="space-y-3 pt-2">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button onClick={onSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-bold py-4 rounded-2xl transition-all text-base disabled:opacity-70">
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
              : <><Sparkles className="w-4 h-4" /> Enviar solicitud</>}
          </button>
          <p className="text-center text-gray-400 text-xs leading-relaxed">
            Al enviar, tu solicitud queda en revisión.<br />
            Te confirmaremos en máximo <span className="font-semibold">48 horas hábiles</span>.
          </p>
        </div>

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
  const [showReview,       setShowReview]       = useState(false)
  const [bannerDismissed,  setBannerDismissed]  = useState(false)
  const [comingFromReview, setComingFromReview] = useState(false)

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
    if (idx === 3 && !data.whatsapp.trim() && !data.website.trim())
      return 'Selecciona un medio de contacto para reservas.'
    if (idx === 4 && data.image_urls.length === 0)
      return 'Sube al menos una imagen de tu negocio.'
    if (idx === 5 && !data.logo_url)
      return 'Sube el logo de tu negocio.'
    return null
  }

  /* ── Summary ── */
  const getSummary = (idx: number): string => {
    if (idx === 0) return data.business_name
    if (idx === 1) return data.address.length > 50 ? data.address.slice(0, 50) + '…' : data.address
    if (idx === 2) { const o = data.business_hours.filter(h => h.open); return `${o.length} día${o.length !== 1 ? 's' : ''} de atención` }
    if (idx === 3) return data.whatsapp ? `WhatsApp: ${data.whatsapp}` : data.website ? `Web: ${data.website}` : ''
    if (idx === 4) { const n = data.image_urls.length; return n > 0 ? `${n} imagen${n !== 1 ? 'es' : ''} subida${n !== 1 ? 's' : ''}` : '' }
    if (idx === 5) return data.logo_url ? 'Logo subido ✓' : ''
    if (idx === 6) { const n = data.amenity_ids.length; return n > 0 ? `${n} servicio${n !== 1 ? 's' : ''} seleccionado${n !== 1 ? 's' : ''}` : 'Sin servicios' }
    if (idx === 7) { const n = data.events.length; return n > 0 ? `${n} promoción${n !== 1 ? 'es' : ''} agregada${n !== 1 ? 's' : ''}` : 'Sin promociones (opcional)' }
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
    const next = idx + 1
    if (next < SECTIONS.length && !comingFromReview) {
      const nextLocked = PART2_INDICES.includes(next) && !PART1_INDICES.every(i => i === idx ? true : completed.has(i))
      if (!nextLocked) setActiveSection(next)
      else setActiveSection(null)
    } else {
      setActiveSection(null)
      setComingFromReview(false)
      setShowReview(true)
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
      main_image_url: data.image_urls[0] || null,
      image_urls: data.image_urls,
      logo_url: data.logo_url || null,
      services: data.services,
      events: data.events,
      promos: data.promos,
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

  if (showReview) return (
    <ReviewScreen
      getSummary={getSummary}
      onEdit={(idx) => {
        setShowReview(false)
        setComingFromReview(true)
        setCompleted(prev => { const s = new Set(prev); s.delete(idx); return s })
        setActiveSection(idx)
        setSectionError(null)
      }}
      onBack={() => setShowReview(false)}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={sectionError}
      bannerDismissed={bannerDismissed}
      onDismissBanner={() => setBannerDismissed(true)}
      session={session}
      services={data.services}
      onServicesChange={(s) => set('services', s)}
      events={data.events}
      onEventsChange={(e) => set('events', e)}
      promos={data.promos}
      onPromosChange={(p) => set('promos', p)}
    />
  )

  const progressPct = Math.round((completed.size / SECTIONS.length) * 100)

  const sectionContent: Record<number, React.ReactNode> = {
    0: <Step1 data={data} set={set} categories={categories} cuisineTypes={cuisineTypes} />,
    1: <Step2 data={data} set={set} zones={zones} />,
    2: <Step3 data={data} set={set} />,
    3: <Step4 data={data} set={set} />,
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
              <ContinuarBtn
                onClick={() => handleContinuar(i)}
                label={isLast ? 'Revisar y enviar' : 'Continuar'}
              />
            </AccordionSection>
          )
        })}

      </div>
    </div>
  )
}
