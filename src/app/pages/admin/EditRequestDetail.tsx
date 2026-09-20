import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import {
  Loader2, ArrowLeft, Building2, CheckCircle2, XCircle,
  AlertCircle, Clock, Wrench, Tag, CalendarDays,
} from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  profile: 'Información del negocio',
  service: 'Servicio',
  promo:   'Promoción',
  event:   'Evento',
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
}

const TYPE_ICON: Record<string, React.FC<any>> = {
  profile: Building2,
  service: Wrench,
  promo:   Tag,
  event:   CalendarDays,
}

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-yellow-400/15 text-yellow-400 border border-yellow-400/25',
  approved: 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/25',
  rejected: 'bg-red-400/15 text-red-400 border border-red-400/25',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado',
}

interface EditRequest {
  id:          number
  type:        string
  action:      string
  payload:     any
  status:      string
  admin_notes: string | null
  submitted_at: string
  site_id:     number
  site: { name: string; logo_url: string | null } | null
}

function PayloadView({ type, action, payload }: { type: string; action: string; payload: any }) {
  if (action === 'delete') {
    return <p className="text-gray-400 text-sm italic">Solicitud para eliminar este {TYPE_LABEL[type]?.toLowerCase()}.</p>
  }

  if (type === 'profile') {
    return (
      <div className="space-y-3 text-sm">
        <Row label="Nombre"      value={payload.business_name} />
        <Row label="Descripción" value={payload.description} />
        <Row label="Dirección"   value={payload.address} />
        <Row label="Precio prom." value={payload.mean_price ? `$${Number(payload.mean_price).toLocaleString()} COP` : null} />
        {payload.logo_url && (
          <div>
            <span className="text-gray-500 text-xs uppercase font-semibold">Logo</span>
            <img src={payload.logo_url} alt="logo" className="mt-1 w-16 h-16 rounded-xl object-cover border border-white/10" />
          </div>
        )}
        {Array.isArray(payload.business_hours) && payload.business_hours.length > 0 && (
          <div>
            <span className="text-gray-500 text-xs uppercase font-semibold">Horarios</span>
            <div className="mt-1 space-y-0.5">
              {payload.business_hours.map((h: any) => (
                <p key={h.weekday} className="text-gray-300 text-xs">Día {h.weekday}: {h.start_time} – {h.end_time}</p>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(payload.contacts) && payload.contacts.length > 0 && (
          <div>
            <span className="text-gray-500 text-xs uppercase font-semibold">Contactos</span>
            <div className="mt-1 space-y-0.5">
              {payload.contacts.map((c: any, i: number) => (
                <p key={i} className="text-gray-300 text-xs">{c.method}: {c.link}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'service') {
    return (
      <div className="space-y-3 text-sm">
        <Row label="Nombre"      value={payload.name} />
        <Row label="Precio"      value={payload.price ? `$${Number(payload.price).toLocaleString()} COP` : null} />
        <Row label="Tipo cobro"  value={payload.charge_type} />
        <Row label="Capacidad"   value={payload.capacity} />
        <Row label="Duración"    value={payload.duration ? `${payload.duration} min` : null} />
        <Row label="Descripción" value={payload.description} />
        {Array.isArray(payload.image_urls) && payload.image_urls.length > 0 && (
          <div>
            <span className="text-gray-500 text-xs uppercase font-semibold">Imágenes</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {payload.image_urls.map((u: string, i: number) => (
                <img key={i} src={u} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'promo') {
    return (
      <div className="space-y-3 text-sm">
        <Row label="Título"      value={payload.title} />
        <Row label="Descripción" value={payload.description} />
        {payload.image_url && (
          <div>
            <span className="text-gray-500 text-xs uppercase font-semibold">Imagen</span>
            <img src={payload.image_url} alt="promo" className="mt-1 w-24 h-24 rounded-xl object-cover border border-white/10" />
          </div>
        )}
      </div>
    )
  }

  if (type === 'event') {
    return (
      <div className="space-y-3 text-sm">
        <Row label="Título"      value={payload.titulo} />
        <Row label="Descripción" value={payload.descripcion} />
        <Row label="Fecha inicio" value={payload.fecha_inicio} />
        <Row label="Fecha fin"   value={payload.fecha_fin} />
        <Row label="Hora"        value={payload.hora} />
        <Row label="Precio"      value={payload.precio ? `$${Number(payload.precio).toLocaleString()} COP` : null} />
        {Array.isArray(payload.image_urls) && payload.image_urls.length > 0 && (
          <div>
            <span className="text-gray-500 text-xs uppercase font-semibold">Imágenes</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {payload.image_urls.map((u: string, i: number) => (
                <img key={i} src={u} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return <pre className="text-gray-400 text-xs whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
}

function Row({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <span className="text-gray-500 text-xs uppercase font-semibold">{label}</span>
      <p className="text-gray-200 mt-0.5">{String(value)}</p>
    </div>
  )
}

export default function EditRequestDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [req,        setReq]        = useState<EditRequest | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null)
  const [notesError, setNotesError] = useState(false)
  const [done,       setDone]       = useState<'approved' | 'rejected' | null>(null)

  useEffect(() => {
    supabase
      .from('business_edit_request')
      .select('*, site(name, logo_url)')
      .eq('id', id!)
      .single()
      .then(({ data }) => {
        if (data) { setReq(data as any); setAdminNotes(data.admin_notes ?? '') }
        setLoading(false)
      })
  }, [id])

  const handleApprove = async () => {
    setProcessing('approve')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-edit-request`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: Number(id), admin_notes: adminNotes || null }),
      }
    )
    setProcessing(null)
    if (res.ok) { setDone('approved'); setReq(prev => prev ? { ...prev, status: 'approved' } : prev) }
    else { alert('Error al aprobar. Revisa los logs.') }
  }

  const handleReject = async () => {
    if (!adminNotes.trim()) { setNotesError(true); return }
    setNotesError(false)
    setProcessing('reject')
    const { error } = await supabase
      .from('business_edit_request')
      .update({ status: 'rejected', admin_notes: adminNotes, reviewed_at: new Date().toISOString() })
      .eq('id', id!)
    setProcessing(null)
    if (!error) { setDone('rejected'); setReq(prev => prev ? { ...prev, status: 'rejected' } : prev) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
      </div>
    )
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-gray-400">
        Solicitud no encontrada.
      </div>
    )
  }

  const Icon = TYPE_ICON[req.type] ?? Building2
  const isPending = req.status === 'pending'

  return (
    <div className="min-h-screen bg-[#0D1117] text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link to="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#25B3CC]/15 border border-[#25B3CC]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {req.site?.logo_url
              ? <img src={req.site.logo_url} alt="" className="w-full h-full object-cover" />
              : <Icon className="w-6 h-6 text-[#25B3CC]" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{req.site?.name ?? 'Negocio'}</h1>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[req.status] ?? ''}`}>
                {STATUS_LABEL[req.status] ?? req.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              {ACTION_LABEL[req.action]} · {TYPE_LABEL[req.type]} ·{' '}
              {new Date(req.submitted_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {done && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-6 ${done === 'approved' ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400' : 'bg-red-400/10 border border-red-400/20 text-red-400'}`}>
            {done === 'approved' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span className="text-sm font-medium">{done === 'approved' ? 'Solicitud aprobada y cambios aplicados.' : 'Solicitud rechazada.'}</span>
          </div>
        )}

        {/* Payload */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Cambios solicitados</h2>
          <PayloadView type={req.type} action={req.action} payload={req.payload} />
        </div>

        {/* Admin notes */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Notas internas {!isPending ? '' : '(requeridas para rechazar)'}
          </label>
          <textarea
            value={adminNotes}
            onChange={e => { setAdminNotes(e.target.value); setNotesError(false) }}
            disabled={!isPending}
            rows={3}
            placeholder="Ej. Imágenes de baja calidad. Se notificó al negocio."
            className={`w-full bg-[#0D1117] border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none transition-all focus:border-[#25B3CC]/50 disabled:opacity-50 ${notesError ? 'border-red-500' : 'border-white/10'}`}
          />
          {notesError && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-red-400 text-xs">Las notas son obligatorias para rechazar.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPending && !done && (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={!!processing}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {processing === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aprobar y aplicar
            </button>
            <button
              onClick={handleReject}
              disabled={!!processing}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {processing === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Rechazar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
