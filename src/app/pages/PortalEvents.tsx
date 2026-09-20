import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useBusinessSites } from '@/lib/useBusinessSite'
import PortalHeader from '@/app/components/PortalHeader'
import { Loader2, Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, Clock, Upload } from 'lucide-react'

const inputCls = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition-all focus:ring-2 focus:ring-[#25B3CC]/15'

interface LiveEvent { id: number; title: string; description: string | null; start_date: string | null; end_date: string | null; price: number | null }
interface EventForm { titulo: string; descripcion: string; fecha_inicio: string; fecha_fin: string; hora: string; precio: string; image_urls: string[] }
const EMPTY: EventForm = { titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', hora: '', precio: '', image_urls: [] }

export default function PortalEvents() {
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

  const [events,     setEvents]     = useState<LiveEvent[]>([])
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [loading,    setLoading]    = useState(false)
  const [form,       setForm]       = useState<EventForm>(EMPTY)
  const [editId,     setEditId]     = useState<number | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<number | null>(null)

  const loadData = async (id: number) => {
    setLoading(true)
    const [evRes, pendRes] = await Promise.all([
      supabase.from('event').select('id, title, description, start_date, end_date, price').eq('site_id', id).eq('active', true).order('id'),
      supabase.from('business_edit_request').select('payload').eq('site_id', id).eq('type', 'event').eq('status', 'pending'),
    ])
    setEvents(evRes.data ?? [])
    setPendingIds(new Set((pendRes.data ?? []).map((r: any) => r.payload?.event_id).filter(Boolean)))
    setLoading(false)
  }

  useEffect(() => { if (siteId) { setSuccess(null); loadData(siteId) } }, [siteId])

  const setF = (k: keyof EventForm, v: any) => setForm(prev => ({ ...prev, [k]: v }))
  const openAdd  = () => { setForm(EMPTY); setEditId(null); setShowForm(true); setSuccess(null); setError(null) }
  const openEdit = (e: LiveEvent) => {
    setForm({ titulo: e.title, descripcion: e.description ?? '', fecha_inicio: e.start_date?.split('T')[0] ?? '', fecha_fin: e.end_date?.split('T')[0] ?? '', hora: '', precio: e.price?.toString() ?? '', image_urls: [] })
    setEditId(e.id); setShowForm(true); setSuccess(null); setError(null)
  }

  const handleImageUpload = async (file: File) => {
    if (!authId) return
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${authId}/event-edit-${siteId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-registrations').upload(path, file, { upsert: true })
    if (!error) { const { data } = supabase.storage.from('business-registrations').getPublicUrl(path); setF('image_urls', [...form.image_urls, data.publicUrl]) }
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!authId || !siteId) return
    if (!form.titulo.trim()) { setError('El título del evento es obligatorio.'); return }
    setSubmitting(true); setError(null)
    const { error: insErr } = await supabase.from('business_edit_request').insert({
      site_id: siteId, auth_id: authId, type: 'event',
      action: editId ? 'update' : 'create',
      payload: { ...form, ...(editId ? { event_id: editId } : {}) },
    })
    setSubmitting(false)
    if (insErr) { setError('Error al enviar. Intenta de nuevo.'); return }
    setSuccess(editId ? 'Cambio enviado a revisión.' : 'Evento enviado a revisión.')
    setShowForm(false)
  }

  const handleDelete = async (eventId: number) => {
    if (!authId || !siteId) return
    const { error: insErr } = await supabase.from('business_edit_request').insert({
      site_id: siteId, auth_id: authId, type: 'event', action: 'delete', payload: { event_id: eventId },
    })
    if (!insErr) { setSuccess('Solicitud de eliminación enviada.'); setPendingIds(prev => new Set([...prev, eventId])) }
    setConfirmDel(null)
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const backTo = `/portal?site=${siteId}`

  if (sitesLoading) return <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <PortalHeader
        title="Eventos"
        subtitle="Los cambios requieren revisión"
        backTo={backTo}
        gradientClass="bg-gradient-to-r from-[#6B3FA0] to-[#4A2970]"
        sites={sites}
        selectedSiteId={siteId}
        onSiteChange={id => navigate(`/portal/events?site=${id}`)}
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#6B3FA0] hover:bg-[#5A3488] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Agregar evento
          </button>
        </div>

        {success && <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /><p className="text-green-700 text-sm">{success}</p></div>}

        {showForm && (
          <div className="bg-white rounded-2xl border border-[#25B3CC]/30 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{editId ? 'Editar evento' : 'Nuevo evento'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Título *</label>
              <input className={inputCls} value={form.titulo} onChange={e => setF('titulo', e.target.value)} maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha inicio</label>
                <input className={inputCls} type="date" value={form.fecha_inicio} onChange={e => setF('fecha_inicio', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha fin</label>
                <input className={inputCls} type="date" value={form.fecha_fin} onChange={e => setF('fecha_fin', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hora</label>
                <input className={inputCls} value={form.hora} onChange={e => setF('hora', e.target.value)} placeholder="Ej. 8:00 PM" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio (COP)</label>
                <input className={inputCls} type="number" value={form.precio} onChange={e => setF('precio', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} maxLength={500} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Imagen / Flyer</label>
              <label className={`flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#25B3CC]/50 transition-colors text-sm text-gray-500 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#25B3CC]" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Subiendo…' : form.image_urls.length > 0 ? `${form.image_urls.length} imagen(es)` : 'Agregar imagen'}
                <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
              </label>
            </div>
            {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-red-600 text-sm">{error}</p></div>}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Enviando…' : 'Enviar a revisión'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" /></div>
        ) : events.length === 0 && !showForm ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No tienes eventos activos.</p>
            <button onClick={openAdd} className="mt-3 text-[#25B3CC] text-sm font-medium hover:text-[#1E9DB5]">+ Agregar evento</button>
          </div>
        ) : (
          events.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{e.title}</p>
                {(e.start_date || e.end_date) && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    {formatDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` – ${formatDate(e.end_date)}` : ''}
                  </p>
                )}
                {e.price != null && <p className="text-gray-400 text-xs">${e.price.toLocaleString()}</p>}
                {pendingIds.has(e.id) && <div className="flex items-center gap-1 mt-1.5"><Clock className="w-3 h-3 text-yellow-500" /><span className="text-yellow-600 text-xs">Cambio en revisión</span></div>}
              </div>
              {confirmDel === e.id ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-600">¿Eliminar?</span>
                  <button onClick={() => handleDelete(e.id)} className="text-xs text-red-600 font-semibold">Sí</button>
                  <button onClick={() => setConfirmDel(null)} className="text-xs text-gray-500">No</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-[#25B3CC] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmDel(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
