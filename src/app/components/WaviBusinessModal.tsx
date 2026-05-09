import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronRight, ChevronLeft, Check,
  Building2, MapPin, User, Clock, Sparkles,
  Instagram, Globe, Phone, Mail, Hash,
  UtensilsCrossed, Coffee, Wine, Music, Hotel, Store,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface FormData {
  // Step 1 — Negocio
  businessName: string;
  businessType: string;
  category: string;
  description: string;
  // Step 2 — Ubicación
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  instagram: string;
  // Step 3 — Responsable
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  howFound: string;
  // Step 4 — Operaciones
  capacity: string;
  openFrom: string;
  openTo: string;
  workDays: string[];
  hasDigitalMenu: string;
  acceptsReservations: string;
  // Step 5 — Legal
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
}

const INITIAL_FORM: FormData = {
  businessName: '', businessType: '', category: '', description: '',
  address: '', neighborhood: '', city: '', state: '', zipCode: '',
  phone: '', website: '', instagram: '',
  contactName: '', contactRole: '', contactEmail: '', contactPhone: '', howFound: '',
  capacity: '', openFrom: '', openTo: '', workDays: [],
  hasDigitalMenu: '', acceptsReservations: '',
  acceptTerms: false, acceptPrivacy: false, acceptMarketing: false,
};

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* ─── Shared Input Styles ────────────────────────────────────────────── */
const inputCls =
  'w-full bg-white/5 border border-white/12 hover:border-white/20 focus:border-[#25B3CC]/60 focus:bg-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-[#25B3CC]/20';
const selectCls =
  'w-full bg-white/5 border border-white/12 hover:border-white/20 focus:border-[#25B3CC]/60 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 appearance-none cursor-pointer focus:ring-1 focus:ring-[#25B3CC]/20';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';

/* ─── Field Wrapper ──────────────────────────────────────────────────── */
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({
  label, required, children, className = ''
}) => (
  <div className={className}>
    <label className={labelCls}>
      {label}
      {required && <span className="text-[#25B3CC] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Step Progress ──────────────────────────────────────────────────── */
const StepIndicator: React.FC<{ current: number; total: number; titles: string[] }> = ({
  current, total, titles
}) => (
  <div className="flex items-center gap-0 w-full">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
            ${i < current
              ? 'bg-[#25B3CC] border-[#25B3CC] text-white'
              : i === current
              ? 'bg-[#25B3CC]/15 border-[#25B3CC] text-[#25B3CC]'
              : 'bg-white/5 border-white/15 text-gray-600'
            }`}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-[9px] font-semibold uppercase tracking-wider hidden sm:block whitespace-nowrap
            ${i === current ? 'text-[#25B3CC]' : i < current ? 'text-gray-400' : 'text-gray-600'}`}>
            {titles[i]}
          </span>
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-px mx-1 transition-all duration-500
            ${i < current ? 'bg-[#25B3CC]' : 'bg-white/10'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ─── Business Type Card ─────────────────────────────────────────────── */
const TypeCard: React.FC<{
  icon: React.ReactNode; label: string; value: string;
  selected: boolean; onClick: () => void;
}> = ({ icon, label, value, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
      ${selected
        ? 'border-[#25B3CC] bg-[#25B3CC]/12 shadow-[0_0_16px_rgba(37,179,204,0.15)]'
        : 'border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/8'
      }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
      ${selected ? 'text-[#25B3CC]' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className={`text-xs font-semibold text-center leading-tight
      ${selected ? 'text-[#25B3CC]' : 'text-gray-400'}`}>
      {label}
    </span>
  </button>
);

/* ─── Day Toggle ─────────────────────────────────────────────────────── */
const DayToggle: React.FC<{ day: string; active: boolean; onClick: () => void }> = ({
  day, active, onClick
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all duration-200 border
      ${active
        ? 'bg-[#25B3CC] border-[#25B3CC] text-white shadow-[0_0_12px_rgba(37,179,204,0.3)]'
        : 'bg-white/5 border-white/12 text-gray-500 hover:border-white/25'
      }`}
  >
    {day}
  </button>
);

/* ─── Radio Card ─────────────────────────────────────────────────────── */
const RadioCard: React.FC<{
  label: string; value: string; selected: string; onChange: (v: string) => void;
}> = ({ label, value, selected, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-sm
      ${selected === value
        ? 'border-[#25B3CC]/60 bg-[#25B3CC]/10 text-white'
        : 'border-white/10 bg-white/4 text-gray-400 hover:border-white/20'
      }`}
  >
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
      ${selected === value ? 'border-[#25B3CC]' : 'border-white/25'}`}>
      {selected === value && <div className="w-1.5 h-1.5 rounded-full bg-[#25B3CC]" />}
    </div>
    {label}
  </button>
);

/* ─── Steps Content ──────────────────────────────────────────────────── */

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: any) => void }) {
  const businessTypes = [
    { value: 'restaurant', label: 'Restaurante', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { value: 'bar', label: 'Bar', icon: <Wine className="w-5 h-5" /> },
    { value: 'cafe', label: 'Café', icon: <Coffee className="w-5 h-5" /> },
    { value: 'rooftop', label: 'Rooftop', icon: <Building2 className="w-5 h-5" /> },
    { value: 'club', label: 'Club / Disco', icon: <Music className="w-5 h-5" /> },
    { value: 'hotel', label: 'Hotel / Spa', icon: <Hotel className="w-5 h-5" /> },
    { value: 'venue', label: 'Venue', icon: <Store className="w-5 h-5" /> },
    { value: 'other', label: 'Otro', icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <Field label="Nombre del establecimiento" required>
        <input
          className={inputCls}
          placeholder="Ej. La Terraza del Centro"
          value={data.businessName}
          onChange={e => set('businessName', e.target.value)}
        />
      </Field>

      <div>
        <label className={labelCls}>
          Tipo de negocio<span className="text-[#25B3CC] ml-0.5">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2.5">
          {businessTypes.map(t => (
            <TypeCard
              key={t.value}
              icon={t.icon}
              label={t.label}
              value={t.value}
              selected={data.businessType === t.value}
              onClick={() => set('businessType', t.value)}
            />
          ))}
        </div>
      </div>

      <Field label="Categoría / Tipo de cocina" required>
        <div className="relative">
          <select
            className={`${selectCls} ${data.category ? 'text-white' : 'text-gray-500'}`}
            value={data.category}
            onChange={e => set('category', e.target.value)}
          >
            <option value="" className="bg-[#0E1419] text-gray-400">Selecciona una categoría</option>
            <option value="mexicana" className="bg-[#0E1419] text-white">🇲🇽 Cocina Mexicana</option>
            <option value="italiana" className="bg-[#0E1419] text-white">🇮🇹 Italiana</option>
            <option value="japonesa" className="bg-[#0E1419] text-white">🇯🇵 Japonesa / Sushi</option>
            <option value="americana" className="bg-[#0E1419] text-white">🇺🇸 Americana</option>
            <option value="mediterranea" className="bg-[#0E1419] text-white">🫒 Mediterránea</option>
            <option value="fusion" className="bg-[#0E1419] text-white">✨ Fusión</option>
            <option value="mariscos" className="bg-[#0E1419] text-white">🦐 Mariscos</option>
            <option value="asador" className="bg-[#0E1419] text-white">🔥 Asador / Parrilla</option>
            <option value="cocteleria" className="bg-[#0E1419] text-white">🍸 Coctelería Premium</option>
            <option value="cafe" className="bg-[#0E1419] text-white">☕ Café & Repostería</option>
            <option value="internacional" className="bg-[#0E1419] text-white">🌍 Internacional</option>
            <option value="otro" className="bg-[#0E1419] text-white">Otro</option>
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
        </div>
      </Field>

      <Field label="Descripción del negocio" required>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Describe brevemente tu negocio, qué lo hace especial, tu propuesta de valor..."
          value={data.description}
          onChange={e => set('description', e.target.value)}
          maxLength={280}
        />
        <div className="text-right text-gray-600 text-[10px] mt-1">{data.description.length}/280</div>
      </Field>
    </div>
  );
}

function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Dirección completa" required>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="Calle, número exterior e interior"
            value={data.address}
            onChange={e => set('address', e.target.value)}
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Colonia / Barrio" required>
          <input
            className={inputCls}
            placeholder="Ej. Polanco"
            value={data.neighborhood}
            onChange={e => set('neighborhood', e.target.value)}
          />
        </Field>
        <Field label="Código Postal">
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className={`${inputCls} pl-10`}
              placeholder="11560"
              value={data.zipCode}
              onChange={e => set('zipCode', e.target.value)}
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ciudad" required>
          <input
            className={inputCls}
            placeholder="Ciudad de México"
            value={data.city}
            onChange={e => set('city', e.target.value)}
          />
        </Field>
        <Field label="Estado" required>
          <div className="relative">
            <select
              className={`${selectCls} ${data.state ? 'text-white' : 'text-gray-500'}`}
              value={data.state}
              onChange={e => set('state', e.target.value)}
            >
              <option value="" className="bg-[#0E1419] text-gray-400">Estado</option>
              {['Ciudad de México','Jalisco','Nuevo León','Estado de México','Puebla','Querétaro',
                'Guanajuato','Yucatán','Veracruz','Otro'].map(s => (
                <option key={s} value={s} className="bg-[#0E1419] text-white">{s}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
          </div>
        </Field>
      </div>

      <Field label="Teléfono del negocio" required>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="+52 55 1234 5678"
            value={data.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Sitio web">
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className={`${inputCls} pl-10`}
              placeholder="www.sunegocio.com"
              value={data.website}
              onChange={e => set('website', e.target.value)}
            />
          </div>
        </Field>
        <Field label="Instagram">
          <div className="relative">
            <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className={`${inputCls} pl-10`}
              placeholder="@sunegocio"
              value={data.instagram}
              onChange={e => set('instagram', e.target.value)}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <User className="w-5 h-5 text-[#25B3CC] shrink-0 mt-0.5" />
        <p className="text-gray-400 text-sm">
          Esta información es para el responsable principal de la cuenta WAVI Business.
          Será el punto de contacto con nuestro equipo de partners.
        </p>
      </div>

      <Field label="Nombre completo" required>
        <input
          className={inputCls}
          placeholder="Nombre y apellido del responsable"
          value={data.contactName}
          onChange={e => set('contactName', e.target.value)}
        />
      </Field>

      <Field label="Cargo / Rol en el negocio" required>
        <div className="relative">
          <select
            className={`${selectCls} ${data.contactRole ? 'text-white' : 'text-gray-500'}`}
            value={data.contactRole}
            onChange={e => set('contactRole', e.target.value)}
          >
            <option value="" className="bg-[#0E1419] text-gray-400">Selecciona tu cargo</option>
            {['Dueño / Propietario', 'Director General', 'Gerente General', 'Gerente de Operaciones',
              'Gerente de Marketing', 'Encargado de Reservaciones', 'Chef / Socio', 'Otro'].map(r => (
              <option key={r} value={r} className="bg-[#0E1419] text-white">{r}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
        </div>
      </Field>

      <Field label="Email de contacto" required>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className={`${inputCls} pl-10`}
            type="email"
            placeholder="correo@sunegocio.com"
            value={data.contactEmail}
            onChange={e => set('contactEmail', e.target.value)}
          />
        </div>
      </Field>

      <Field label="Teléfono directo / WhatsApp" required>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="+52 55 9876 5432"
            value={data.contactPhone}
            onChange={e => set('contactPhone', e.target.value)}
          />
        </div>
      </Field>

      <Field label="¿Cómo nos encontraste?">
        <div className="relative">
          <select
            className={`${selectCls} ${data.howFound ? 'text-white' : 'text-gray-500'}`}
            value={data.howFound}
            onChange={e => set('howFound', e.target.value)}
          >
            <option value="" className="bg-[#0E1419] text-gray-400">Selecciona una opción</option>
            {['Instagram / Redes Sociales', 'Recomendación de otro negocio', 'Evento WAVI',
              'Google / Internet', 'Prensa / Medios', 'Equipo de ventas WAVI', 'Otro'].map(h => (
              <option key={h} value={h} className="bg-[#0E1419] text-white">{h}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
        </div>
      </Field>
    </div>
  );
}

function Step4({ data, set }: { data: FormData; set: (k: keyof FormData, v: any) => void }) {
  const toggleDay = (day: string) => {
    const current = data.workDays;
    if (current.includes(day)) {
      set('workDays', current.filter(d => d !== day));
    } else {
      set('workDays', [...current, day]);
    }
  };

  return (
    <div className="space-y-6">
      <Field label="Capacidad aproximada del local" required>
        <div className="relative">
          <input
            className={inputCls}
            type="number"
            placeholder="Ej. 80 personas"
            value={data.capacity}
            onChange={e => set('capacity', e.target.value)}
            min="1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">personas</span>
        </div>
      </Field>

      <div>
        <label className={labelCls}>Horario de operación<span className="text-[#25B3CC] ml-0.5">*</span></label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-gray-600 mb-1.5">Apertura</p>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="time"
                className={`${inputCls} pl-10 [color-scheme:dark]`}
                value={data.openFrom}
                onChange={e => set('openFrom', e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-600 mb-1.5">Cierre</p>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="time"
                className={`${inputCls} pl-10 [color-scheme:dark]`}
                value={data.openTo}
                onChange={e => set('openTo', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Días de operación<span className="text-[#25B3CC] ml-0.5">*</span></label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(d => (
            <DayToggle
              key={d}
              day={d}
              active={data.workDays.includes(d)}
              onClick={() => toggleDay(d)}
            />
          ))}
          <button
            type="button"
            onClick={() => set('workDays', data.workDays.length === DAYS.length ? [] : [...DAYS])}
            className="px-4 h-10 rounded-xl text-xs font-semibold border border-white/12 bg-white/5 text-gray-400 hover:text-[#25B3CC] hover:border-[#25B3CC]/30 transition-all"
          >
            {data.workDays.length === DAYS.length ? 'Ninguno' : 'Todos'}
          </button>
        </div>
      </div>

      <div>
        <label className={labelCls}>¿Tienes menú digital?</label>
        <div className="flex flex-wrap gap-2">
          {[{ v: 'si', l: 'Sí, tenemos' }, { v: 'no', l: 'No todavía' }, { v: 'en-proceso', l: 'En proceso' }].map(o => (
            <RadioCard key={o.v} label={o.l} value={o.v} selected={data.hasDigitalMenu} onChange={v => set('hasDigitalMenu', v)} />
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>¿Aceptas reservaciones actualmente?</label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'si', l: 'Sí, por teléfono / web' },
            { v: 'no', l: 'No, solo walk-in' },
            { v: 'queremos', l: 'Queremos empezar' },
          ].map(o => (
            <RadioCard key={o.v} label={o.l} value={o.v} selected={data.acceptsReservations} onChange={v => set('acceptsReservations', v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, set }: { data: FormData; set: (k: keyof FormData, v: any) => void }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Nombre del negocio', value: data.businessName || '—' },
    { label: 'Tipo', value: data.businessType || '—' },
    { label: 'Categoría', value: data.category || '—' },
    { label: 'Ciudad', value: `${data.city}${data.state ? ', ' + data.state : ''}` || '—' },
    { label: 'Responsable', value: data.contactName || '—' },
    { label: 'Email', value: data.contactEmail || '—' },
    { label: 'Teléfono', value: data.contactPhone || '—' },
    { label: 'Capacidad', value: data.capacity ? `${data.capacity} personas` : '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#25B3CC]" />
          <span className="text-white text-sm font-semibold">Resumen de tu solicitud</span>
        </div>
        <div className="divide-y divide-white/6">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <span className="text-gray-500 text-xs">{r.label}</span>
              <span className="text-white text-xs font-medium max-w-[200px] text-right truncate">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div className="space-y-3">
        {[
          {
            key: 'acceptTerms' as keyof FormData,
            label: 'Acepto los',
            link: 'Términos y Condiciones',
            required: true,
          },
          {
            key: 'acceptPrivacy' as keyof FormData,
            label: 'He leído la',
            link: 'Política de Privacidad',
            required: true,
          },
          {
            key: 'acceptMarketing' as keyof FormData,
            label: 'Acepto recibir comunicaciones de WAVI Business',
            link: '',
            required: false,
          },
        ].map(item => (
          <label
            key={item.key as string}
            className="flex items-start gap-3 cursor-pointer group"
          >
            <button
              type="button"
              onClick={() => set(item.key, !data[item.key])}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                ${data[item.key] as boolean
                  ? 'bg-[#25B3CC] border-[#25B3CC]'
                  : 'border-white/20 bg-white/5 group-hover:border-white/35'
                }`}
            >
              {(data[item.key] as boolean) && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className="text-gray-400 text-sm leading-relaxed">
              {item.label}{' '}
              {item.link && (
                <span className="text-[#25B3CC] underline underline-offset-2 cursor-pointer hover:text-[#7FDAEB]">
                  {item.link}
                </span>
              )}
              {item.required && <span className="text-[#25B3CC] ml-0.5">*</span>}
            </span>
          </label>
        ))}
      </div>

      <div className="bg-[#25B3CC]/8 border border-[#25B3CC]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#25B3CC] shrink-0 mt-0.5" />
        <p className="text-gray-400 text-sm leading-relaxed">
          Una vez enviada tu solicitud, nuestro equipo de partners se pondrá en contacto contigo
          en un plazo máximo de <span className="text-white font-semibold">48 horas hábiles</span> para confirmar la verificación de tu negocio.
        </p>
      </div>
    </div>
  );
}

/* ─── Success Screen ─────────────────────────────────────────────────── */
function SuccessScreen({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-10 px-6"
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
        <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">
          ¡Bienvenido al ecosistema WAVI, {name || 'partner'}!
        </h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
          Hemos recibido tu solicitud. Nuestro equipo de partners te contactará en
          <span className="text-white font-semibold"> 48 horas hábiles</span> para completar tu verificación y activar tu perfil.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-xs mx-auto">
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
        <button
          onClick={onClose}
          className="bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(37,179,204,0.3)]"
        >
          Volver al sitio
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Validation ─────────────────────────────────────────────────────── */
function validateStep(step: number, data: FormData): string | null {
  if (step === 0) {
    if (!data.businessName.trim()) return 'El nombre del negocio es obligatorio.';
    if (!data.businessType) return 'Selecciona el tipo de negocio.';
    if (!data.category) return 'Selecciona una categoría.';
    if (!data.description.trim()) return 'Agrega una descripción breve.';
  }
  if (step === 1) {
    if (!data.address.trim()) return 'La dirección es obligatoria.';
    if (!data.neighborhood.trim()) return 'La colonia / barrio es obligatoria.';
    if (!data.city.trim()) return 'La ciudad es obligatoria.';
    if (!data.state) return 'El estado es obligatorio.';
    if (!data.phone.trim()) return 'El teléfono del negocio es obligatorio.';
  }
  if (step === 2) {
    if (!data.contactName.trim()) return 'El nombre del responsable es obligatorio.';
    if (!data.contactRole) return 'Selecciona tu cargo.';
    if (!data.contactEmail.trim()) return 'El email de contacto es obligatorio.';
    if (!/\S+@\S+\.\S+/.test(data.contactEmail)) return 'Ingresa un email válido.';
    if (!data.contactPhone.trim()) return 'El teléfono de contacto es obligatorio.';
  }
  if (step === 3) {
    if (!data.capacity) return 'La capacidad del local es obligatoria.';
    if (!data.openFrom || !data.openTo) return 'El horario de operación es obligatorio.';
    if (data.workDays.length === 0) return 'Selecciona al menos un día de operación.';
  }
  if (step === 4) {
    if (!data.acceptTerms) return 'Debes aceptar los Términos y Condiciones.';
    if (!data.acceptPrivacy) return 'Debes aceptar la Política de Privacidad.';
  }
  return null;
}

/* ─── Main Modal ─────────────────────────────────────────────────────── */
export const WaviBusinessModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open, onClose
}) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const TOTAL = 5;
  const stepTitles = ['Negocio', 'Ubicación', 'Contacto', 'Operación', 'Confirmar'];
  const stepSubtitles = [
    'Cuéntanos sobre tu establecimiento',
    'Dónde encontramos tu negocio',
    'Quién gestiona la cuenta',
    'Horarios y capacidad',
    'Revisa y envía tu solicitud',
  ];

  const set = (key: keyof FormData, val: any) => {
    setData(prev => ({ ...prev, [key]: val }));
    setError(null);
  };

  const handleNext = () => {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setError(null);
    if (step < TOTAL - 1) {
      setStep(s => s + 1);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
      setError(null);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  const handleSubmit = async () => {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulate API call
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setData(INITIAL_FORM);
      setError(null);
      setSubmitted(false);
    }, 400);
  };

  // Trap scroll on body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const steps = [
    <Step1 key={0} data={data} set={set} />,
    <Step2 key={1} data={data} set={set} />,
    <Step3 key={2} data={data} set={set} />,
    <Step4 key={3} data={data} set={set} />,
    <Step5 key={4} data={data} set={set} />,
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)] border border-white/10"
            style={{
              background: 'linear-gradient(145deg, #0D1117 0%, #0A0E14 50%, #080C12 100%)',
            }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#25B3CC]/8 rounded-full blur-[60px] pointer-events-none" />

            {/* ── Header ── */}
            {!submitted && (
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
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/12 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step indicator */}
                <StepIndicator current={step} total={TOTAL} titles={stepTitles} />

                {/* Step title */}
                <div className="mt-5">
                  <h2 className="text-white font-bold text-lg tracking-tight">{stepSubtitles[step]}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Paso {step + 1} de {TOTAL}</p>
                </div>
              </div>
            )}

            {/* ── Body ── */}
            <div ref={scrollRef} className="relative z-10 overflow-y-auto flex-1 px-6 py-5 custom-scrollbar">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <SuccessScreen key="success" name={data.businessName} onClose={handleClose} />
                ) : (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    {steps[step]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Error ── */}
            <AnimatePresence>
              {error && !submitted && (
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
            {!submitted && (
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
                      className={`rounded-full transition-all duration-300
                        ${i === step ? 'w-5 h-1.5 bg-[#25B3CC]' : i < step ? 'w-1.5 h-1.5 bg-[#25B3CC]/50' : 'w-1.5 h-1.5 bg-white/12'}`}
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
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Enviar Solicitud
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
