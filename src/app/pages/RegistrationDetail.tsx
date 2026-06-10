import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import {
  Loader2, ArrowLeft, Building2, MapPin, Clock, Phone,
  CheckCircle2, XCircle, AlertCircle, Check,
} from 'lucide-react'

const DAYS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const METHOD_LABEL: Record<string, string> = {
  phone: 'Teléfono', whatsapp: 'WhatsApp', website: 'Sitio web', instagram: 'Instagram',
}

export default function RegistrationDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [reg,        setReg]        = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null)
  const [notesError, setNotesError] = useState(false)

  /* Catalog maps  id → name */
  const [categories,  setCategories]  = useState<Record<number, string>>({})
  const [amenities,   setAmenities]   = useState<Record<number, string>>({})
  const [cuisineTypes,setCuisineTypes]= useState<Record<number, string>>({})

  useEffect(() => {
    Promise.all([
      supabase.from('business_registration').select('*, zone:zone_id(name)').eq('id', id!).single(),
      supabase.from('category').select('id, name'),
      supabase.from('additional_service').select('id, name'),
      supabase.from('cuisine_type').select('id, name'),
    ]).then(([regRes, catsRes, amenRes, ctRes]) => {
      if (regRes.data) {
        setReg(regRes.data)
        setAdminNotes(regRes.data.admin_notes ?? '')
      }
      if (catsRes.data) setCategories(Object.fromEntries(catsRes.data.map(x => [x.id, x.name])))
      if (amenRes.data) setAmenities(Object.fromEntries(amenRes.data.map(x => [x.id, x.name])))
      if (ctRes.data)   setCuisineTypes(Object.fromEntries(ctRes.data.map(x => [x.id, x.name])))
      setLoading(false)
    })
  }, [id])

  const handleApprove = async () => {
    setProcessing('approve')
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-registration`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({ registration_id: Number(id), admin_notes: adminNotes || null }),
      }
    )

    setProcessing(null)
    if (res.ok) {
      navigate('/admin')
    } else {
      const err = await res.json()
      alert(`Error al aprobar: ${err.error}`)
    }
  }

  const handleReject = async () => {
    if (!adminNotes.trim()) { setNotesError(true); return }
    setNotesError(false)
    setProcessing('reject')

    const { error } = await supabase
      .from('business_registration')
      .update({
        status:      'rejected',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id!)

    setProcessing(null)
    if (!error) navigate('/admin')
    else alert('Error al rechazar la solicitud.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
      </div>
    )
  }
  if (!reg) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-gray-500">
        Solicitud no encontrada.
      </div>
    )
  }

  const isPending = reg.status === 'pending'

  return (
    <div className="min-h-screen bg-[#0D1117] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">

        <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        {/* Status banner (if already processed) */}
        {!isPending && (
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 mb-6 border ${
            reg.status === 'approved'
              ? 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400'
              : 'bg-red-400/10 border-red-400/25 text-red-400'
          }`}>
            {reg.status === 'approved'
              ? <CheckCircle2 className="w-5 h-5 shrink-0" />
              : <XCircle     className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-semibold">
              {reg.status === 'approved' ? 'Aprobado' : 'Rechazado'}
              {reg.reviewed_at && ` · ${new Date(reg.reviewed_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}`}
            </span>
            {reg.admin_notes && (
              <span className="text-xs ml-2 opacity-80 truncate">{reg.admin_notes}</span>
            )}
          </div>
        )}

        <div className="space-y-4">

          {/* Basic info */}
          <Section title="Información del negocio" icon={<Building2 className="w-4 h-4" />}>
            <Row label="Nombre"      value={reg.business_name} />
            <Row label="Descripción" value={reg.description} />
            <Row label="Precio prom." value={
              reg.mean_price ? `$${Number(reg.mean_price).toLocaleString('es-CO')} COP` : '—'
            } />
            <Row label="Categorías" value={
              reg.category_ids?.map((i: number) => categories[i]).filter(Boolean).join(', ') || '—'
            } />
            {reg.cuisine_type_ids?.length > 0 && (
              <Row label="Cocina" value={
                reg.cuisine_type_ids.map((i: number) => cuisineTypes[i]).filter(Boolean).join(', ')
              } />
            )}
          </Section>

          {/* Location */}
          <Section title="Ubicación" icon={<MapPin className="w-4 h-4" />}>
            <Row label="Dirección" value={reg.address} />
            <Row label="Zona"      value={(reg.zone as any)?.name ?? '—'} />
            {reg.location_lat && (
              <Row label="Coordenadas" value={`${reg.location_lat?.toFixed(5)}, ${reg.location_lng?.toFixed(5)}`} />
            )}
          </Section>

          {/* Static map preview */}
          {reg.location_lat && reg.location_lng && import.meta.env.VITE_GOOGLE_MAPS_KEY && (
            <div className="rounded-2xl overflow-hidden border border-white/8">
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${reg.location_lat},${reg.location_lng}&zoom=16&size=700x180&maptype=roadmap&markers=color:0x25B3CC%7C${reg.location_lat},${reg.location_lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`}
                alt="Ubicación del negocio"
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          {/* Hours */}
          <Section title="Horarios" icon={<Clock className="w-4 h-4" />}>
            {reg.business_hours?.length > 0 ? (
              reg.business_hours.map((h: any) => (
                <Row key={h.weekday} label={DAYS[h.weekday]} value={`${h.start_time} — ${h.end_time}`} />
              ))
            ) : (
              <p className="text-gray-600 text-sm">No especificados</p>
            )}
          </Section>

          {/* Amenities */}
          {reg.amenity_ids?.length > 0 && (
            <Section title="Comodidades" icon={<Check className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-2">
                {reg.amenity_ids.map((i: number) => amenities[i] && (
                  <span key={i} className="px-3 py-1 rounded-full bg-white/6 border border-white/10 text-gray-300 text-xs">
                    {amenities[i]}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Contacts */}
          <Section title="Contactos" icon={<Phone className="w-4 h-4" />}>
            {reg.contacts?.length > 0 ? (
              reg.contacts.map((c: any, i: number) => (
                <Row key={i} label={METHOD_LABEL[c.method] ?? c.method} value={c.link} />
              ))
            ) : (
              <p className="text-gray-600 text-sm">No especificados</p>
            )}
          </Section>

          {/* Submitter */}
          <Section title="Solicitante" icon={<Building2 className="w-4 h-4" />}>
            <Row label="Email"   value={reg.email} />
            <Row label="Enviado" value={new Date(reg.submitted_at).toLocaleString('es-CO', {
              dateStyle: 'medium', timeStyle: 'short',
            })} />
          </Section>

          {/* Admin actions */}
          {isPending && (
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Decisión</h3>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
                  Notas <span className="text-gray-600 normal-case">(obligatorio para rechazar)</span>
                </label>
                <textarea
                  rows={3}
                  className={`w-full bg-white/5 border ${notesError ? 'border-red-500/50' : 'border-white/12'} hover:border-white/20 focus:border-[#25B3CC]/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none focus:ring-1 focus:ring-[#25B3CC]/20`}
                  placeholder="Notas internas o motivo de rechazo..."
                  value={adminNotes}
                  onChange={e => { setAdminNotes(e.target.value); setNotesError(false) }}
                />
                {notesError && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Las notas son obligatorias para rechazar.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={!!processing}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processing === 'approve'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  Aprobar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!!processing}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processing === 'reject'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <XCircle className="w-4 h-4" />}
                  Rechazar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ─── Local helpers ──────────────────────────────────────────────────────────── */
function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/8 bg-white/3">
        <span className="text-[#25B3CC]">{icon}</span>
        <h3 className="text-white text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 items-start">
      <span className="text-gray-500 text-xs w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-white text-sm flex-1 break-words">{value || '—'}</span>
    </div>
  )
}
